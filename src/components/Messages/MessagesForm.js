import React, {Component} from 'react';
import uuidv4 from 'uuid/v4';
import firebase from '../../firebase';
import { Segment, Button, Input } from "semantic-ui-react";
import FileModal from './FileModal'
import ProgressBar from "./ProgressBar";
import { Picker, emojiIndex } from "emoji-mart";
import 'emoji-mart/css/emoji-mart.css';

class MessagesForm extends Component {
  state = {
    storageRef: firebase.storage().ref(),
    message: '',
    loading: false,
    uploadState: '',
    uploadTask: null,
    typingRef: firebase.database().ref('typing'),
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    errors: [],
    modal: false,
    percentUploaded: 0,
    emojiPicker: false
  };

  componentWillUnmount() {
    if (this.state.uploadTask !== null) {
      this.state.uploadTask.cancel();
      this.setState({ uploadTask: null});
    }
  }

  openModal = () => {
    this.setState({modal: true});
  };

  closeModal = () => {
    this.setState({modal: false});
  };

  handleChange = event => {
    this.setState({[event.target.name]: event.target.value});
  };

  createMessage = (fileUrl = null) => {
    const message = {
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      user: {
        id: this.state.user.uid,
        name: this.state.user.displayName,
        avatar: this.state.user.photoURL
      }
    };
    if (fileUrl !== null) {
      message['image'] = fileUrl;
    } else {
      message['content'] = this.state.message;
    }
    return message;
  };

  sendMessage = () => {
    const { getMessagesRef } = this.props;
    const { message, channel, errors, typingRef, user } = this.state;

    if (message) {
      this.setState({loading: true, errors: []});
      getMessagesRef()
        .child(channel.id)
        .push()
        .set(this.createMessage())
        .then(() => {
          this.setState({ loading: false, message: ''});
          typingRef
            .child(channel.id)
            .child(user.uid)
            .remove()
        })
        .catch(err => {
          this.setState({
            loading: false,
            errors: [...errors, err]
          })
        })
    } else {
      this.setState({
        errors: [...errors, {message: 'Add a message'}]
      })
    }
  };

  getPath = () => {
    if (this.props.isPrivateChannel) {
      return `chat/private/${this.state.channel.id}`;
    } else {
      return 'chat/public';
    }
  };

  uploadFile = (file, metadata) => {
    const pathToUpload = this.state.channel.id;
    const ref = this.props.getMessagesRef();
    const filePath = `${this.getPath()}/${uuidv4()}.jpg`;

    this.setState({
      uploadState: 'uploading',
      uploadTask: this.state.storageRef.child(filePath).put(file, metadata)
    }, () => {
      this.state.uploadTask.on('state_changed', snap => {
          const percentUploaded = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          this.props.isProgressBarVisible(percentUploaded);
          this.setState({percentUploaded});
        },
        err => {
          console.log(err);
          this.setState({
            errors: [...this.state.errors, err],
            uploadState: 'error',
            uploadTask: null,
          })
        },
        () => {
          this.state.uploadTask.snapshot.ref.getDownloadURL()
            .then(downloadUrl => {
              this.sendFileMessage(downloadUrl, ref, pathToUpload);
            })
            .catch( err => {
              console.log(err);
              this.setState({
                errors: [...this.state.errors, err],
                uploadState: 'error',
                uploadTask: null,
              })
            })
        }
      )
    })
  };

  sendFileMessage = (fileUrl, ref, pathToUpload) => {
    ref.child(pathToUpload)
      .push()
      .set(this.createMessage(fileUrl))
      .then(() => {
        this.setState({uploadState: 'done'})
      })
      .catch(err => {
        console.error(err);
        this.setState({
          errors: [...this.state.errors, err],
        })
      })

  };

  handleKeyDown = event => {
    console.log();
    if (event.key === "Enter") {
      this.sendMessage();
    }

    const { message, typingRef, channel, user } = this.state;
    if (message) {
      typingRef
        .child(channel.id)
        .child(user.uid)
        .set(user.displayName)
    } else {
      typingRef
        .child(channel.id)
        .child(user.uid)
        .remove()
    }

  };

  handleTogglePicker = () =>{
    this.setState({ emojiPicker: !this.state.emojiPicker})
  };

  handleAddEmoji = emoji => {
    const oldMessage = this.state.message;
    const newMessage = this.colonToUnicode(`${oldMessage} ${emoji.colons} `);
    this.setState({ message: newMessage, emojiPicker: false});
    setTimeout(() => this.messageInputRef.focus(), 0);

  };

  colonToUnicode = message => {
    return message.replace(/:[A-Za-z0-9_+-]+:/g, x => {
      x = x.replace(/:/g, "");
      let emoji = emojiIndex.emojis[x];
      if (typeof  emoji !== "undefined") {
        let unicode = emoji.native;
        if (typeof unicode !== "undefined") {
          return unicode;
        }
      }
      x = ":" + x + ":";
      return x;
    });
  };

  render() {
    const { errors, message, loading, modal, uploadState, percentUploaded, emojiPicker } = this.state;
    return (
      <Segment className="messages__form">
        {emojiPicker && (
          <Picker
            set="apple"
            onSelect={this.handleAddEmoji}
            className="emojipicker"
            title="Pick your emoji"
            emoji="point_up"
          />
        )}
        <Input
          fluid
          name="message"
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          style={{marginBottom: '0.7em'}}
          label={
            <Button
              icon={emojiPicker ? 'close': 'add'}
              content={emojiPicker ? 'Close': null}
              onClick={this.handleTogglePicker}
            />
          }
          value={message}
          labelPosition="left"
          placeholder="Write your message"
          className={
            errors.some(error => error.message.includes('message')) ? 'error': ''
          }
          ref={node => (this.messageInputRef = node)}
        />
        <Button.Group icon widths="2">
          <Button
            color="orange"
            content="Add Reply"
            labelPosition="left"
            icon="edit"
            onClick={this.sendMessage}
            disabled={loading}
          />
          <Button
            color="teal"
            content="Upload Media"
            labelPosition="right"
            icon="cloud upload"
            disabled={uploadState === 'uploading'}
            onClick={this.openModal}
          />
        </Button.Group>
        <FileModal
          modal={modal}
          uploadFile={this.uploadFile}
          closeModal={this.closeModal}
        />
        <ProgressBar
          uploadState={uploadState}
          percentUploaded={percentUploaded}
        />
      </Segment>
    );
  }
}

export default MessagesForm;
