import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

window.signUp = async function () {
  const userVal = document.getElementById("username").value;
  const emailVal = document.getElementById("email").value;
  const passVal = document.getElementById("password").value;

  if (!userVal || !emailVal || !passVal) return alert("Please fill all fields");

  try {
    const res = await createUserWithEmailAndPassword(auth, emailVal, passVal);
    await setDoc(doc(db, "users", res.user.uid), {
      username: userVal,
      email: emailVal,
      createdAt: Date.now()
    });
    window.location.href = "chat.html";
  } catch (err) { alert(err.message); }
};

window.login = async function () {
  const emailVal = document.getElementById("email").value;
  const passVal = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, emailVal, passVal);
    window.location.href = "chat.html";
  } catch (err) { alert(err.message); }
};