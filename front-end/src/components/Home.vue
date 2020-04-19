<template>
  <div class="wrapper">
    <div class="header">
      <nav class="navbar navbar-expand navbar-light bg-light">
      <a href="/" class="navbar-brand"><h1><span style="color:#42b983">Text</span><span style="color:#8080D0"><i class="fas fa-link" />Share</span></h1></a>
      
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              Troubleshooting&nbsp;<i class="fas fa-code"></i>
            </a>
            <div class="dropdown-menu" aria-labelledby="navbarDropdown">
              <a class="dropdown-item" @click="push()">Force Push</a>
              <a class="dropdown-item" @click="get()">Force Retrieve</a>
              <a class="dropdown-item" @click="debug()">Log Debug Info</a>
            </div>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              Font Size&nbsp;<i class="fas fa-font"></i>
            </a>
            <div class="dropdown-menu" aria-labelledby="navbarDropdown" style="font-family: 'OCR A', 'Lucida Console';">
              <a class="dropdown-item" style="font-size:18px" @click="changeFontSize('extrasmall')">Extra Small</a>
              <a class="dropdown-item" style="font-size:22px" @click="changeFontSize('small')">Small</a>
              <a class="dropdown-item" style="font-size:26px" @click="changeFontSize('medium')">Medium</a>
              <a class="dropdown-item" style="font-size:30px" @click="changeFontSize('large')">Large</a>
            </div>
          </li>
          <li class="nav-item">            
            <button class="btn nav-link" :data-clipboard-text="extLink()">Copy Link&nbsp;<i class="fas fa-copy"></i></button>
          </li>
          <li class="nav-item">            
            <button class="btn nav-link" style="color:#EF1010" @click="close()">Delete Note&nbsp;<i class="fas fa-trash-alt"></i></button>
          </li>
        </ul>
        <form class="form-inline my-2 my-lg-0">
          <!-- <input class="form-control mr-sm-2k" type="search" placeholder="Search" aria-label="Search"> -->
        </form>
      </div>
    </nav>
      <!-- <button @click="get()">Get</button><button @click="push()">Push</button><button @click="deleteText()">Delete</button><br><br> -->
    </div>
    <div class="text" v-if="textId">
      <textarea placeholder="Type here.." v-model="text" v-bind:style="{ fontSize: fontSize + 'px' }" @input="txtChanged()" />
    </div>
    <div v-else>
      <p>Loading...</p>
    </div>
  </div>
</template>

<script>
const axios = require('axios');
const ClipboardJS = require('clipboard');
export default {
  name: 'Home',
  data() {
    return {
      textId: "",
      text: "",
      publicPushKey: "BC4yQNCgkoLAGPLDZRPVD3iQll7lhnKUETgWin6PjP4vOs_S-IS8ojb-xU8tks9zi3B4ZLJNfuzt04iVvUe7sbY",
      timer: null,
      fontSize: 26
    };
  },
  props: {
    
  },
  async created() {    
    //bind clipboard js
    new ClipboardJS('.btn');

    // assign the client a random id so that it knows
    // when it's a different computer sending the changes
    this.clientId = Math.random().toString(36).substr(2, 6);

    // console.log("created, client id: " + this.clientId);

    // get (or create) existing note
    if (window.location.search.includes('id')) {
      // const regex = /\/\$(.*?)[/]?$/;
      const regex = /(&|\?)id=(.*?)($|&)/m;
      let match = regex.exec(window.location.search);
      if (match) {
        this.textId = match[2];
        //
        // console.log("found existing text: " + this.textId);
        //
        await this.get();

        //

        // console.log("get has got, subscribing to push");
        
        // subscribe to push notifications
        this.subscribePushNotifications();
      }
      else {
        this.init();
      }
    }
    else
      this.init();
  },
  methods: {
    urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    },
    async subscribePushNotifications() {
      if ('serviceWorker' in navigator) {
        const register = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });


        navigator.serviceWorker.addEventListener('message', event => {
            // console.log("msg received from sw");
            if (this.clientId != event.data.clientId) {
              // console.log("getting");
              this.get();
              //
              // console.log("getting bc client is diff");
            }
            // else
              // console.log("not getting");
        });

        const subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.publicPushKey),
        });

        axios.post("/api/subscribe/" + this.textId + "?clientId=" + this.clientId, subscription).then((res) => {
          res;
        });
      }
      else {
        console.log("Browser doesn't support service workers.");
      }
    },
    async init() {
      let txt = await axios.post("/api");
      if (txt.data) {
        // this.textId = txt.data.NewTextID;
        window.location.search = "?id=" + txt.data.NewTextID;
        console.log("created new text, id: " + txt.data.textId);
      }
      else
        alert("failed to create new note");
    },
    get() {
      if (this.textId) {
        let req = axios.get("/api/" + this.textId);
        req.then((res) => {
          if (res.data)
            this.text = res.data.text;
          // else {
          //   this.init();
          //   alert("Invalid url. Creating new pag1");
          // }
        });
        req.catch((err) => {
          this.init();
          alert("Invalid url. You may be trying to access a note that no longer exists. A new note will be created.");
          err;
        })
      }
    },
    push() {
      if (this.textId) {
        var body = { text: this.text, clientId: this.clientId };
        axios.put("/api/" + this.textId, body).then((res) => {
          // should return OK
          res;
        });
      }
    },
    deleteText() {
      if (this.textId) {
        axios.delete("/api/" + this.textId).then((res) => {
          this.text = "";
          this.init();
          res;
        });
      }
    },
    txtChanged() {
      // Start timer over again
      clearTimeout(this.timer);
      this.timer = setTimeout(this.timerUp, 250);
    },
    timerUp() {
      // Timer has gone off - that means that the user actually is done editing for now
      // Disable timer if applicable
      this.push();
    },
    debug() {
      console.log("Troubleshooting information:");
      console.log("Client ID: " + this.clientId);
      console.log("Text Id: " + this.textId);
    },
    changeFontSize(size) {
      // this.fontsize = size;
      if (size == "extrasmall")
        this.fontSize = 18;
      else if (size == "small")
        this.fontSize = 22;
      else if (size == "medium")
        this.fontSize = 26;
      else if (size == "large")
        this.fontSize = 30;
        
    },
    close() {
      this.deleteText();
    },
    extLink() {
      return window.location;
    }
    // closing(e) {
    //   alert('Closing');
    //   this.deleteText();

    //   e;
    // }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

a:hover {
  cursor: pointer;
}

h1 {
  font-family: 'Arial Black', sans-serif;
  font-size: 32px;
  font-weight: bold;
}

div.text {
  position: absolute;
  top: 60px;
  bottom: 0px;
  left: 0;
  right: 0;
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  margin: 0px;
  border: none;
}
textarea {
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  
  /* background-color: azure; */

  resize: none;
  border: none;
  padding: 32px;

  /* font-size: 12px; */
  font-family: 'OCR A', 'Lucida Console';
}

/* div.wrapper {
  height: calc(100% - (100px + 150px));
}

div.header {
  height: 20%;
}

div.text {
  height: 80%;
}

textarea {
  width: 100%;
  height: 100%;
  resize: none
} */

h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
