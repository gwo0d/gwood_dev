function showOnChain() {
  onchain_div = document.getElementById("onchain");
  lightning_div = document.getElementById("lightning");
  lightning_div.style.display = "none";
  if (onchain_div.style.display == "block") {
    onchain_div.style.display = "none";
  } else {
    onchain_div.style.display = "block";
  }
}

function showLightning() {
  lightning_div = document.getElementById("lightning");
  onchain_div = document.getElementById("onchain");
  onchain_div.style.display = "none";
  if (lightning_div.style.display == "block") {
    lightning_div.style.display = "none";
  } else {
    lightning_div.style.display = "block";
  }
}
