import { auth, db } from "./firebase.js";
import { collection, addDoc, query, orderBy, limit, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let userData = null;
let unsubscribe = null; // Stores the listener so we can stop it if needed

// 1. MONITOR LOGIN STATUS
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // If not logged in, go back to login page
        if (unsubscribe) unsubscribe();
        window.location.href = "index.html";
    } else {
        // Get the user's display name from the database
        try {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) {
                userData = snap.data();
            } else {
                // Fallback if they don't have a profile yet
                userData = { username: user.email.split('@')[0] };
            }
            
            // Start loading messages only once
            if (!unsubscribe) {
                loadMessages();
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
        }
    }
});

// 2. SEND MESSAGE FUNCTION
window.sendMessage = async () => {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();
    
    if (!text || !userData) return;

    try {
        await addDoc(collection(db, "messages"), {
            text: text,
            sender: userData.username,
            timestamp: Date.now(),
            type: "global"
        });
        input.value = ""; // Clear input after sending
    } catch (err) {
        // If this alerts, you probably need to click the Index link in the Console (F12)
        alert("Send Error: " + err.message);
    }
};

// 3. LOAD MESSAGES (OPTIMIZED)
function loadMessages() {
    const box = document.getElementById("messages");
    
    // LIMIT(50) prevents the site from downloading too much data and hitting Netlify limits
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"), limit(50));
    
    unsubscribe = onSnapshot(q, (snap) => {
        const messages = [];
        
        snap.forEach(d => {
            messages.push(d.data());
        });

        // Reverse them so the newest message is at the bottom
        messages.reverse();

        box.innerHTML = ""; // Clear the box before re-drawing
        
        messages.forEach(m => {
            const el = document.createElement("div");
            const isMe = userData && m.sender === userData.username;
            
            el.className = `message ${isMe ? 'sent' : 'received'}`;
            el.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
            box.appendChild(el);
        });

        // AUTO-SCROLL to the bottom
        box.scrollTop = box.scrollHeight;
    }, (error) => {
        console.error("Snapshot error:", error);
    });
}

// 4. UTILITY FUNCTIONS
window.logout = () => {
    if (unsubscribe) unsubscribe();
    signOut(auth);
};

// Handle "Enter" key to send
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        window.sendMessage();
    }
});