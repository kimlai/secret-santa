const result = JSON.parse(
  atob(new URLSearchParams(window.location.search).get("data"))
);

result.forEach(([gifter, giftee]) => {
  const div = document.createElement("div");
  div.innerHTML = gifter;
  div.addEventListener("click", () => {
    if (div.classList.contains("flipped")) {
      div.innerHTML = gifter;
      div.classList.remove("flipped");
    } else {
      div.innerHTML = giftee;
      div.classList.add("flipped");
    }
  });
  document.getElementById("result").appendChild(div);
});
