const init = async () => {
  const {
    bitcoin: { blocks },
  } = mempoolJS({
    hostname: "mempool.space",
  });

  const blocksTipHeight = await blocks.getBlocksTipHeight();

  document.getElementById("result").textContent = JSON.stringify(
    blocksTipHeight,
    undefined,
    2,
  );
};

init();
setInterval(init, 10000);
