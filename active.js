/* Highlights the <a> whose href matches the current file name */
document.addEventListener("DOMContentLoaded", () =>{
    const page = location.pathname.split("/").pop();       
    document.querySelectorAll(".navbar a").forEach(link =>{
      if (link.getAttribute("href") === page){
        link.classList.add("active");
        link.setAttribute("aria-current","page");
      }
    });
  });
  