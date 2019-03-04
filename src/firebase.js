import firebase from 'firebase/app';
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

const config = {
  apiKey: "AIzaSyChnjQmBdXCrl3JNLcJHBIhwtugkFmT2yM",
  authDomain: "react-slack-clone-c684c.firebaseapp.com",
  databaseURL: "https://react-slack-clone-c684c.firebaseio.com",
  projectId: "react-slack-clone-c684c",
  storageBucket: "react-slack-clone-c684c.appspot.com",
  messagingSenderId: "852224690394"
};

firebase.initializeApp(config);

export default firebase;
