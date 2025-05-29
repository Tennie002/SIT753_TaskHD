/*
  Runs on contact.html.
  - Checks required fields
  - Validates e-mail pattern
  - Phone = digits, ≤ 15 chars
  - Shows inline error messages (no pop-ups)
*/
document.addEventListener("DOMContentLoaded", ()=>{
    const form = document.getElementById("queryForm");
    const fields = ["name","email","phone","message"];
  
    form.addEventListener("submit", e =>{
      let valid = true;
  
      // clear previous messages
      document.querySelectorAll(".form-error").forEach(el=>el.textContent="");
  
      const name   = form.name.value.trim();
      const email  = form.email.value.trim();
      const phone  = form.phone.value.trim();
      const msg    = form.message.value.trim();
  
      // Name – required
      if(!name){
        showErr("nameErr","Please enter your name");
      }
  
      // Email – simple regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if(!emailRegex.test(email)){
        showErr("emailErr","Enter a valid e-mail address");
      }
  
      // Phone – digits only, ≤15
      if(!/^\d{6,15}$/.test(phone)){
        showErr("phoneErr","Phone must be 6-15 digits");
      }
  
      // Message – required
      if(!msg){
        showErr("msgErr","Please write your query");
      }
  
      // If any .form-error has text, prevent submit
      valid = [...document.querySelectorAll(".form-error")]
              .every(el => el.textContent === "");
      if(!valid){ e.preventDefault(); }
    });
  
    function showErr(id,msg){
      document.getElementById(id).textContent = msg;
    }
  });
  