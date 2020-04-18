<template>
  <div class="wrapper">
    <div class="header">
      <button @click="get()">Get</button><button @click="push()">Push</button><button @click="deleteText()">Delete</button><br><br>
    </div>
    <div class="text" v-if="textId">
      <textarea placeholder="Type here.." v-model="text" @input="txtChanged()" />
    </div>
    <div v-else>
      <p>Loading...</p>
    </div>
  </div>
</template>

<script>
const axios = require('axios');
export default {
  name: 'Home',
  data() {
    return {
      textId: "",
      text: "",
      publicPushKey: "BC4yQNCgkoLAGPLDZRPVD3iQll7lhnKUETgWin6PjP4vOs_S-IS8ojb-xU8tks9zi3B4ZLJNfuzt04iVvUe7sbY",
      timer: null,
    };
  },
  props: {
    
  },
  created() {    
    // assign the client a random id so that it knows
    // when it's a different computer sending the changes
    this.clientId = Math.random().toString(36).substr(2, 6);

    // get (or create) existing note
    if (window.location.search.includes('id')) {
      // const regex = /\/\$(.*?)[/]?$/;
      const regex = /(&|\?)id=(.*?)($|&)/m;
      let match = regex.exec(window.location.search);
      if (match) {
        this.textId = match[2];
        this.get();
      }
      else {
        this.init();
      }
    }
    else
      this.init();

    // subscribe to push notifications
    this.subscribePushNotifications();
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
            if (this.clientId != event.data.clientId) {
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

        axios.post('/api/subscribe', subscription).then((res) => {
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
          alert("Invalid url. Creating new page");
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

/* body {margin: 0; height: 100%; overflow: hidden} */

div.wrapper {
  
}
textarea {
  position: absolute;
  bottom:0px;
  left: 0px;
  height: 80%;
  width: 100%;
  resize: none;
  border: none;
  padding: 32px;

  font-size: 28px;
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
