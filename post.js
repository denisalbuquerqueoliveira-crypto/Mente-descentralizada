import fetch from "node-fetch";

const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

// ====== CONFIGURAÇÃO RÁPIDA ======
const THRESHOLD = Number(process.env.ALERTA_THRESHOLD || 5); // % (padrão 5%)
// ================================

function pct(n){ return (n>=0?`+${n.toFixed(2)}`:n.toFixed(2)).replace('.',','); }
function brl(n){ return `R$ ${n.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}`; }

async function send(content){
  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
}

async function run(){
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=brl&include_24hr_change=true";
  const r = await fetch(url);
  if(!r.ok) throw new Error("CoinGecko falhou: "+r.status);
  const d = await r.json();

  const btc = d.bitcoin, eth = d.ethereum, sol = d.solana;

  // Mensagem diária consolidada
  const msg =
    `💰 **Preços — ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}**\n`+
    `• **BTC**: ${brl(btc.brl)} | 24h: ${pct(btc.brl_24h_change)}%\n`+
    `• **ETH**: ${brl(eth.brl)} | 24h: ${pct(eth.brl_24h_change)}%\n`+
    `• **SOL**: ${brl(sol.brl)} | 24h: ${pct(sol.brl_24h_change)}%`;
  await send(msg);

  // Alertas por variação
  const checks = [
    { sym: "BTC", price: btc.brl, ch: btc.brl_24h_change },
    { sym: "ETH", price: eth.brl, ch: eth.brl_24h_change },
    { sym: "SOL", price: sol.brl, ch: sol.brl_24h_change },
  ];

  for (const c of checks){
    if (Math.abs(c.ch) >= THRESHOLD){
      const emoji = c.ch >= 0 ? "🚀" : "⚠️";
      const alerta =
        `${emoji} **Alerta de Variação** (${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })})\n` +
        `• ${c.sym}: ${pct(c.ch)}% nas últimas 24h | Preço: ${brl(c.price)}\n` +
        `Limite configurado: ±${THRESHOLD}%`;
      await send(alerta);
    }
  }
}

run().catch(async (e)=>{
  await send(`⚠️ Erro ao atualizar preços: ${e.message}`);
  process.exit(1);
});
