import React, {Component} from 'react';
import firebase from '../../firebase';
import { Segment, Button, Input } from "semantic-ui-react";

class MessagesForm extends Component {
  state = {
    message: '',
    loading: false,
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    errors: []
  };

  handleChange = event => {
    this.setState({[event.target.name]: event.target.value});
  };

  createMessage = () => {
    return {
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      content: this.state.message,
      user: {
        id: this.state.user.uid,
        name: this.state.user.displayName,
        avatar: this.state.user.photoURL
      }
    };
  };

  sendMessage = () => {
    const { messagesRef } = this.props;
    const { message, channel, errors } = this.state;

    if (message) {
      this.setState({loading: true, errors: []});
      messagesRef
        .child(channel.id)
        .push()
        .set(this.createMessage())
        .then(() => {
          this.setState({ loading: false, message: ''});
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

  render() {
    const { errors, message, loading } = this.state;
    return (
      <Segment className="messages__form">
        <Input
          fluid
          name="message"
          onChange={this.handleChange}
          style={{marginBottom: '0.7em'}}
          label={<Button icon={'add'} />}
          value={message}
          labelPosition="left"
          placeholder="Write your message"
          className={
            errors.some(error => error.message.includes('message')) ? 'error': ''
          }
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
          />
        </Button.Group>
      </Segment>
    );
  }
}

export default MessagesForm;
