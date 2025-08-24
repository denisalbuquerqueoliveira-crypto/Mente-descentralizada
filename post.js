import fetch from "node-fetch";

const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

function pct(n){ return (n>=0?`+${n.toFixed(2)}`:n.toFixed(2)).replace('.',','); }
function brl(n){ return `R$ ${n.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}`; }

async function run(){
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=brl&include_24hr_change=true";
  const r = await fetch(url);
  if(!r.ok) throw new Error("CoinGecko falhou: "+r.status);
  const d = await r.json();

  const btc = d.bitcoin, eth = d.ethereum, sol = d.solana;
  const msg =
    `💰 **Preços — ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}**\n`+
    `• **BTC**: ${brl(btc.brl)} | 24h: ${pct(btc.brl_24h_change)}%\n`+
    `• **ETH**: ${brl(eth.brl)} | 24h: ${pct(eth.brl_24h_change)}%\n`+
    `• **SOL**: ${brl(sol.brl)} | 24h: ${pct(sol.brl_24h_change)}%`;

  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: msg })
  });
}

run().catch(async (e)=>{
  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `⚠️ Erro ao atualizar preços: ${e.message}` })
  });
  process.exit(1);
});
