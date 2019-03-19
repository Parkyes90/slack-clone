import React, {Component, Fragment} from 'react';
import MessagesHeader from './MessagesHeader';
import MessagesForm from './MessagesForm';
import Message from './Message';
import { Segment, Comment } from "semantic-ui-react";
import firebase from '../../firebase';
import { connect }  from 'react-redux';
import {setUserPosts} from "../../actions";
import Typing from './Typing';
import Skeleton from "./Skeleton";

class Messages extends Component {
  state = {
    messagesRef: firebase.database().ref('messages'),
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    messages: [],
    messagesLoading: true,
    progressBar: false,
    numUniqueUsers: '',
    searchTerm: '',
    searchLoading: false,
    isChannelStarred: false,
    searchResults: [],
    typingUsers: [],
    usersRef: firebase.database().ref("users"),
    privateChannel: this.props.isPrivateChannel,
    privateMessagesRef: firebase.database().ref('privateMessages'),
    typingRef: firebase.database().ref('typing'),
    connectedRef: firebase.database().ref('.info/connected')

  };

  componentDidMount() {
    const { channel, user } = this.state;

    if (channel && user) {
      this.addListeners(channel.id);
      this.addUserStarsListener(channel.id, user.uid);
    }
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.messagesEnd) {
      this.scrollToBottom();
    }
  };

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({behavior: 'smooth'});
  };

  addUserStarsListener = (channelId, userId) => {
    this.state.usersRef
      .child(userId)
      .child('starred')
      .once('value')
      .then(data => {
        if (data.val() !== null) {
          const channelIds = Object.keys(data.val());
          const prevStarred = channelIds.includes(channelId);
          this.setState({ isChannelStarred: prevStarred });
        }
      })
  };

  addListeners = channelId => {
    this.addMessageListener(channelId);
    this.addTypingListeners(channelId);
  };

  addTypingListeners = channelId => {
    let typingUsers = [];
    this.state.typingRef.child(channelId).on('child_added', snap => {
      if (snap.key !== this.state.user.uid) {
        typingUsers = [...typingUsers, {id: snap.key, name: snap.val()}];
        this.setState({ typingUsers })
      }
    });

    this.state.typingRef.child(channelId)
      .on('child_removed', snap=> {
        const index = typingUsers.findIndex(user => user.id === snap.key);
        if (index !== -1) {
          typingUsers = typingUsers.filter(user => user.id !== snap.key);
          this.setState({ typingUsers });
        }
      });
    this.state.connectedRef.on('value', snap => {
      if (snap.val() === true) {
        this.state.typingRef
          .child(channelId)
          .child(this.state.user.uid)
          .onDisconnect()
          .remove(err => {
            if (err !== null) {
              console.error(err);
            }
          })
      }
    });
  };

  addMessageListener = channelId => {
    let loadedMessages = [];
    const ref = this.getMessagesRef();
    ref.child(channelId).on('child_added', snap => {
      loadedMessages.push(snap.val());
      this.setState({
        messages: loadedMessages,
        messagesLoading: false
      });
      this.countUserPosts(loadedMessages);
      this.countUniqueUsers(loadedMessages);
    });

  };

  countUserPosts = messages => {
    let userPosts = messages.reduce((acc, message) => {
      if (message.user.name in acc) {
        acc[message.user.name].count += 1;
      } else {
        acc[message.user.name] = {
          avatar: message.user.avatar,
          count: 1
        }
      }
      return acc;
    }, {});
    this.props.setUserPosts(userPosts);
  };

  countUniqueUsers = messages => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if (!acc.includes(message.user.name)) {
        acc.push(message.user.name);
      }
      return acc;
    }, []);
    const plural = uniqueUsers.length > 1 || uniqueUsers === 0;
    const numUniqueUsers =  `${uniqueUsers.length} user${plural ? 's' : ''}`;
    this.setState({ numUniqueUsers });
  };

  displayMessages = messages => (
    messages.length > 0 && messages.map(message => (
      <Message
        key={message.timestamp}
        message={message}
        user={this.state.user}
      />
    ))
  );

  isProgressBarVisible = percent => {
    if (percent > 0) {
      this.setState({ progressBar : true});
    }
  };

  displayChannelName = channel => {
    return channel ? `${this.state.privateChannel ? '@' : '#'}${channel.name}` : '';
  };

  handleSearchChange = event => {
    this.setState({
      searchTerm: event.target.value,
      searchLoading: true
    }, () => {
      this.handleSearchMessages();
    });
  };

  handleSearchMessages = () => {
    const channelMessages = [...this.state.messages];
    const regex = new RegExp(this.state.searchTerm, 'gi');
    const searchResults = channelMessages.reduce((acc, message) => {
      if ((message.content && message.content.match(regex)) || message.user.name.match(regex)) {
        acc.push(message);
      }
      return acc;
    }, []);
    this.setState({searchResults});
    setTimeout(() => this.setState({searchLoading: false}), 1000);
  };

  getMessagesRef = () => {
    const { messagesRef, privateMessagesRef, privateChannel } = this.state;
    return privateChannel ? privateMessagesRef : messagesRef;
  };

  handleStar = () => {
    this.setState(prevState => ({
      isChannelStarred: !prevState.isChannelStarred
    }), () => this.starChannel());
  };

  starChannel = () => {
    if (this.state.isChannelStarred) {
      this.state.usersRef
        .child(`${this.state.user.uid}/starred`)
        .update({
          [this.state.channel.id]: {
            name: this.state.channel.name,
            details: this.state.channel.details,
            createdBy: {
              name: this.state.channel.createdBy.name,
              avatar: this.state.channel.createdBy.avatar
            }
          }
        })
        .then(response => {
          console.log(response)
        })
        .catch(err => {
          console.error(err)
        })
    } else {
      this.state.usersRef
        .child(`${this.state.user.uid}/starred`)
        .child(this.state.channel.id)
        .remove(err => {
          if (err !== null) {
            console.log(err);
          }
        });
    }
  };

  displayTypingUsers = users => (
    users.length > 0 && users.map(user => (
      <div style={{ display: "flex", alignItems: "center", marginBottom: '0.2em'}} key={user.id}>
        <span className="user__typing">{user.name} is typing</span> <Typing />
      </div>
    ))
  );

  displayMessageSkeleton = loading =>
    loading ? (
      <React.Fragment>
        {[...Array(10)].map((_, i) =>(
          <Skeleton key={i} />
        ))}
      </React.Fragment>
    ) : null;

  render() {
    const {
      messagesRef, channel, user, messages, progressBar,
      numUniqueUsers, searchTerm, searchResults, searchLoading,
      privateChannel, isChannelStarred, typingUsers, messagesLoading}= this.state;
    return (
      <Fragment>
        <MessagesHeader
          channelName={this.displayChannelName(channel)}
          numUniqueUsers={numUniqueUsers}
          handleSearchChange={this.handleSearchChange}
          searchLoading={searchLoading}
          isPrivateChannel={privateChannel}
          handleStar={this.handleStar}
          isChannelStarred={isChannelStarred}
        />
        <Segment>
          <Comment.Group className={progressBar ? 'messages__progress' : 'messages'}>
            {this.displayMessageSkeleton(messagesLoading)}
            {searchTerm ? this.displayMessages(searchResults) : this.displayMessages(messages)}
            {this.displayTypingUsers(typingUsers)}
            <div ref={node => (this.messagesEnd = node)}></div>
          </Comment.Group>
        </Segment>
        <MessagesForm
          messagesRef={messagesRef}
          currentChannel={channel}
          currentUser={user}
          isProgressBarVisible={this.isProgressBarVisible}
          isPrivateChannel={privateChannel}
          getMessagesRef={this.getMessagesRef}
        />
      </Fragment>
    );
  }
}

export default connect(null, { setUserPosts })(Messages);
