const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const activeUsers = [];

const addUser = ({ id, uid, room }) => {
  const user = { id, uid, room };
  activeUsers.push(user);
  //console.log(user);
  return user;
};

const getUser = (id) => {
  const user = activeUsers.find((user) => user.id === id);
  return user;

};

const app = express();
//const http = require('http').createServer(app);
//const io = require('socket.io')(http);
const socket = require('socket.io');
app.use(bodyParser.json());
app.use(cors());

const users = [
  {
      username: 'test',
      email: 'test@test.com',
      password: 'test',
      id: 12,
      theme: 'light',
      beFound: true
    },
    {
      username: 'test2',
      email: 'test2@test.com',
      password: 'test2',
      id: 8,
      theme: 'dark',
      beFound: false
    },
    {
      username: 'test3',
      email: 'test3@test.com',
      password: 'test3',
      id: 10,
      theme: 'sleek',
      beFound: true
    },
    {
      username: 'test4',
      email: 'test4@test.com',
      password: 'test4',
      id: 19,
      theme: 'sleek',
      beFound: true
    }
];

const chats = [
  {
      chatId: 3,
      users: [12, 8],
      messages: [
        {
          id: 1,
          user: 8,
          text: 'asojnas',
          time: 1608824822131
        },
        {
          id: 2,
          user: 8,
          text: 'asojasernas',
          time: 1608824822133
        }
      ]
    },
    {
      chatId: 4,
      users: [12, 10],
      messages: [
        {
          id: 4,
          user: 10,
          text: 'hello',
          time: 1608824822131
        },
        {
          id: 5,
          user: 12,
          text: 'hola',
          time: 1608824822133
        }
      ]
    },
    {
      chatId: 5,
      users: [ 8, 10],
      messages: [
        {
          id: 6,
          user: 10,
          text: 'sim',
          time: 1608824822131
        },
        {
          id: 7,
          user: 8,
          text: 'nu',
          time: 1608824822133
        }
      ]
    }
];

// sign in - post = success / fail and user settings 
app.post('/sign-in', (req, res) => {
    let user;
    users.forEach(u => {
      if (req.body.email === u.email && req.body.password === u.password) {
        user = ({ userId: u.id, username:  u.username, theme: u.theme, beFound: u.beFound })
      }
    });
    if (user) {
      res.json(user);
    } else {
      res.status(400).json({ error: 'error loging in'});
    }
});

// register - post = user
app.post('/register', (req, res) => {
    const { email, username, password } = req.body;
    users.push({
        username: username,
        email: email,
        password: password,
        id: Math.floor(Math.random() * 100),
        theme: 'light',
        beFound: true
    });
    res.json(users[users.length - 1]);
});


// change settings - post = settings

app.patch('/:uid/settings', (req, res) => {
  const { uid } = req.params;
  const { username, theme, beFound } = req.body;
  let user = users.findIndex(user => user.id === parseInt(uid, 10));
  if (user >= 0) {
    users[user] = { ...users[user], username, theme, beFound };
    res.json({ theme: users[user].theme, beFound: users[user].beFound, username: users[user].username });
  } else {
    res.status(404).json('something went wrong');
  }
});

// get /:uid - get = chats
app.get('/:uid', (req, res) => {
  const { uid } = req.params;
  const userChats = [];
  chats.forEach(chat => {
      let index = chat.users.findIndex(id => id === parseInt(uid, 10));
      if (index >= 0) {
        let otherUser = chat.users.findIndex(id => id !== parseInt(uid, 10));
        let other = users.find(user => user.id === chat.users[otherUser]);
        let final = { ...chat, to: other.username };
        userChats.push(final);

      }
  });
  if (userChats.length > 0) {
      res.json(userChats);
  } else {
      res.status(404).json('no chats');
  }
});

// get /:uid/chat/:chatId = chat
app.get('/:uid/chat/:chatId', (req, res) => {
  const { uid, chatId } = req.params;
  let selectedChat;
  chats.forEach(chat => {
      let index = chat.users.findIndex(id => id === parseInt(uid, 10));
      if (index >= 0 && chat.chatId === parseInt(chatId, 10)) {
        let otherUser = chat.users.findIndex(id => id !== parseInt(uid, 10));
        let other = users.find(user => user.id === chat.users[otherUser]);
        let final = { ...chat, to: other.username };
        selectedChat = final;
      }    
  });
  if (selectedChat) {
      res.json(selectedChat);
  } else {
      res.status(404).json('chat not found');
  }
});

// add chat - post /:uid/new-chat
app.post('/:uid/new-chat/:toUid', (req, res) => {
  const { uid, toUid } = req.params;
  const { username } = users.find(user => user.id === parseInt(toUid, 10));
  let newChat = {
    chatId: Math.floor(Math.random() * 1000),
      users: [ parseInt(uid, 10), parseInt(toUid, 10)],
      to: username,
      messages: []
  };
  chats.push(newChat);
  res.json(newChat);

}); 

// add message - post /:uid/chat/:chatId
app.post('/:uid/chat/:chatId', (req, res) => {
  const { uid, chatId } = req.params;
  const { user, text, time, id } = req.body;
  let chatIndex = -1;
  chats.forEach((chat, i) => {
      let index = chat.users.findIndex(id => id === parseInt(uid, 10));
      if (index >= 0 && chat.chatId === parseInt(chatId, 10)) {
          chatIndex = i;
      }
  });
  if (chatIndex > -1) {
      chats[chatIndex].messages.push({
          id: id,
          user: user,
          text: text,
          time: time
      });
      
      res.json(chats[chatIndex]);
  } else {
      res.status(404).json('something went wrong');
  }
});

// delete message - delete /:uid/chat/:chatId/message/:id
/*app.delete('/:uid/chat/:chatId/message/:id', (req, res) => {
    const { uid, chatId, id } = req.params;
    chats.forEach(chat => {
        if (chat.userId === parseInt(uid, 10) && chat.chatId === parseInt(chatId, 10)) {
            const index = chat.messages.findIndex((message) => message.id === parseInt(id, 10));
            chat.messages.splice(index, 1);
            res.json(chat.messages);
        } else {
            res.status(404).json('something went wrong');
        }
    });
});*/

// get users - get /:uid/users
app.get('/:users/:search', (req, res) => {
    const { search } = req.params;
    let results = [];
    users.forEach(user => {
      if (user.username.toLowerCase().indexOf(search.toLowerCase()) > -1 && user.beFound) {
        results.push({ user: user.username, id: user.id });
      }
    });

    if (results.length > 0) {
      res.json(results);
  } else {
      res.status(404).json('we couldn\'t find any users');
  }
});

// add chat - post /:uid

// update settings - patch /:uid/settings

const server = app.listen(3001, () => {
    console.log('app is running')
});

// socket setup
const io = socket(server, { 
  cors: {
    origin: '*',
  }
});

io.on('connection', function(socket) {
  console.log('made socket connection');

  socket.on('join', ({ uid, room }, callback) => {
    //console.log(uid, room);
    const user = addUser({ id: socket.id, uid, room });
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${uid} has joined!`});
    socket.join(user.room);
    callback();
  });

  socket.on('message', (message, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit('message', { message: message });
    //callback();
  });

  socket.on('disconnect', () => {
    console.log('user has left');
  })

  /*socket.on('message', function(data) {
    console.log(data);
  })*/
});

