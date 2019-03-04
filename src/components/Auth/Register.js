import React, { Component } from 'react';
import firebase from '../../firebase';
import { Grid, Form, Segment, Button, Header, Message, Icon } from "semantic-ui-react";
import { Link } from "react-router-dom";

class Register extends Component {
  state = {
    username: '',
    password: '',
    email: '',
    passwordConfirmation: '',
    errors: []
  };
  isFormValid = () => {
    let errors = [];
    let error;
    if (this.isFormEmpty(this.state)) {
      error = { message: 'Fill in all fields'};
      this.setState({errors: [...errors, error]});
      return false
    } else if (!this.isPasswordValid(this.state)) {
      error = { message: 'Password is invalid'};
      this.setState({errors: [...errors, error]});
      return false;
    } else {
      return true;
    }
  };

  isFormEmpty = ({ username, email, password, passwordConfirmation }) => {
    return !username.length || !email.length || !password.length || !passwordConfirmation.length
  };
  isPasswordValid = ({ password, passwordConfirmation}) => {
    if(password.length < 6 || passwordConfirmation.length < 6) {
      return false;
    } else return password === passwordConfirmation;
  };

  handleChange = event => {
    this.setState({[event.target.name]: event.target.value})
  };

  handleSubmit = event => {
    if (this.isFormValid()) {
      const { email, password } = this.state;
      event.preventDefault();
      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then(createUser => {
          console.log(createUser);
        })
        .catch(err => {
          console.log(err);
        });
    }

  };

  render() {
    const { username, password, email, passwordConfirmation } = this.state;
    const { handleChange, handleSubmit } = this;
    return (
      <Grid textAlign="center" verticalAlign="middle" className="app">
        <Grid.Column style={{maxWidth:450, bottom: '10%'}}>
          <Header as="h2" icon color="orange" textAlign="center">
            <Icon name="puzzle piece" color="orange" />
            Register for DevChat
          </Header>
          <Form onSubmit={handleSubmit} size="large">
            <Segment stacked>
              <Form.Input
                fluid
                name="username"
                icon="user"
                iconPosition="left"
                placeholder="Username"
                onChange={handleChange}
                type="text"
                value={username}
              />
              <Form.Input
                fluid
                name="email"
                icon="mail"
                iconPosition="left"
                placeholder="Email"
                onChange={handleChange}
                type="email"
                value={email}
              />
              <Form.Input
                fluid
                name="password"
                icon="lock"
                iconPosition="left"
                placeholder="Password"
                onChange={handleChange}
                type="password"
                value={password}
              />
              <Form.Input
                fluid
                name="passwordConfirmation"
                icon="repeat"
                iconPosition="left"
                placeholder="Password Confirmation"
                onChange={handleChange}
                type="password"
                value={passwordConfirmation}
              />
              <Button color="orange" fluid size="large">Submit</Button>
            </Segment>
          </Form>
          <Message>Already a user? <Link to="/login">Login</Link></Message>
        </Grid.Column>

      </Grid>
    );
  }
}

export default Register;
