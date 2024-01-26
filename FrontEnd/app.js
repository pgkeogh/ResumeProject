const navBtn = document.getElementById("nav-btn");
const navbar = document.getElementById("navbar");
const navClose = document.getElementById("nav-close");

navBtn.addEventListener("click", () => {
  navbar.classList.add("showNav");
});

navClose.addEventListener("click", () => {
  navbar.classList.remove("showNav");
});
// page view counter
let visitCount = localStorage.getItem("page_view");
if (visitCount == null) {
  visitCount = 1;
} else {
  visitCount = Number(visitCount) + 1;
}
localStorage.setItem("page_view", visitCount);
document.write("You are visitor number " + visitCount + ".");
