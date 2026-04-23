import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction, set, get } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCvJNhwsV7_WKl7iee8IpZiEj1iL1r2ZLM",
  authDomain: "livepollapp-1c50b.firebaseapp.com",
  databaseURL: "https://livepollapp-1c50b-default-rtdb.firebaseio.com/",
  projectId: "livepollapp-1c50b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;

// LOGIN
document.getElementById("loginBtn").onclick = () => {
  signInWithPopup(auth, provider);
};

// LOGOUT
document.getElementById("logoutBtn").onclick = () => {
  signOut(auth);
};

// AUTH STATE
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    document.getElementById("userInfo").innerText =
      "👤 " + user.displayName;

    document.getElementById("loginBtn").style.display = "none";
    document.getElementById("logoutBtn").style.display = "inline-block";

    // Check if already voted
    const snapshot = await get(ref(db, 'userVotes/' + user.uid));
    if (snapshot.exists()) {
      disableButtons();
    }

  } else {
    currentUser = null;

    document.getElementById("userInfo").innerText = "";
    document.getElementById("loginBtn").style.display = "inline-block";
    document.getElementById("logoutBtn").style.display = "none";
  }
});

// VOTE
window.vote = async function(option) {
  if (!currentUser) {
    alert("Please login first!");
    return;
  }

  const userVoteRef = ref(db, 'userVotes/' + currentUser.uid);
  const snapshot = await get(userVoteRef);

  if (snapshot.exists()) {
    alert("You already voted!");
    disableButtons();
    return;
  }

  // Save vote
  await set(userVoteRef, option);

  // Update count
  const voteRef = ref(db, 'votes/' + option);
  runTransaction(voteRef, (current) => (current || 0) + 1);

  disableButtons();
};

// Disable buttons
function disableButtons() {
  document.querySelectorAll(".poll button").forEach(btn => {
    btn.disabled = true;
  });
}

// LIVE RESULTS
const votes = { A: 0, B: 0, C: 0 };

['A','B','C'].forEach(option => {
  const voteRef = ref(db, 'votes/' + option);

  onValue(voteRef, (snapshot) => {
    votes[option] = snapshot.val() || 0;
    updateUI();
  });
});

// UPDATE UI
function updateUI() {
  const total = votes.A + votes.B + votes.C;

  ['A','B','C'].forEach(option => {
    const count = votes[option];
    const percent = total ? ((count / total) * 100).toFixed(1) : 0;

    document.getElementById('count' + option).innerText =
      `${option}: ${count} (${percent}%)`;

    document.getElementById('bar' + option).style.width =
      percent + "%";
  });
}