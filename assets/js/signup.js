// === PASSWORD GENERATOR ===
document.getElementById("generateBtn").addEventListener("click", () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  document.getElementById("password").value = password;
  navigator.clipboard.writeText(password);
  alert("Password generated and copied to clipboard!");
});

// === FORM SUBMIT ===
document.getElementById("signupForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = {
    firstName: document.getElementById("firstName").value,
    middleInitial: document.getElementById("middleInitial").value,
    lastName: document.getElementById("lastName").value,
    position: document.getElementById("position").value,
    email: document.getElementById("emailAddress").value,
    username: document.getElementById("username").value,
    contact: document.getElementById("contactNo").value,
    password: document.getElementById("password").value,
  };

  if (!formData.password) {
    alert("Please generate a password before submitting!");
    return;
  }

  console.log("New Employee:", formData);
  alert("Employee account created successfully!");
  event.target.reset();
});
