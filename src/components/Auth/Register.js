import React, { Component } from 'react';
import firebase from '../../firebase';
import { Grid, Form, Segment, Button, Header, Message, Icon } from "semantic-ui-react";
import { Link } from "react-router-dom";
import md5 from 'md5';

class Register extends Component {
  state = {
    username: '',
    password: '',
    email: '',
    passwordConfirmation: '',
    errors: [],
    loading: false,
    usersRef: firebase.database().ref('users')
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
    event.preventDefault();
    if (this.isFormValid()) {
      this.setState({ errors: [], loading: true});
      const { email, password } = this.state;
      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then(createUser => {
          console.log(createUser);
          createUser.user.updateProfile({
            displayName: this.state.username,
            photoURL: `http://gravatar.com/avatar/${md5(createUser.user.email)}?d=identicon`
          })
            .then(() => {
              this.saveUser(createUser).then(() => {
                console.log('user saved')
              });
              this.setState({loading: false});
            })
            .catch(err => {
              this.setState({errors: [...this.state.errors, err], loading: false});
              console.error(err);
            })
        })
        .catch(err => {
          this.setState({errors: [...this.state.errors, err], loading: false});
          console.error(err);
        });
    }

  };
  displayErrors = errors =>
    errors.map((error, i) => <p key={i}>{error.message}</p>);

  handleInputError = (errors, inputName) => errors.some(
    error => error.message.toLowerCase().includes(inputName)) ? 'error' : ''
  ;

  saveUser = createUser => {
    return this.state.usersRef.child(createUser.user.uid).set({
      name: createUser.user.displayName,
      avatar: createUser.user.photoURL
    });
  };

  render() {
    const { username, password, email, passwordConfirmation, errors, loading } = this.state;
    const { handleChange, handleSubmit } = this;
    return (
      <Grid textAlign="center" verticalAlign="middle" className="app">
        <Grid.Column style={{maxWidth:450, bottom: '10%'}}>
          <Header as="h1" icon color="orange" textAlign="center">
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
                className={this.handleInputError(errors, "email")}
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
                className={this.handleInputError(errors, "password")}
              />
              <Form.Input
                fluid
                name="passwordConfirmation"
                icon="repeat"
                iconPosition="left"
                placeholder="Password Confirmation"
                onChange={handleChange}
                type="password"
                className={this.handleInputError(errors, "password")}
                value={passwordConfirmation}
              />
              <Button disabled={loading} className={loading ? 'loading' : ''} color="orange" fluid size="large">Submit</Button>
            </Segment>
          </Form>
          {errors.length > 0 && (
            <Message error>
              <h3>Error</h3>
              {this.displayErrors(errors)}
            </Message>
          )}
          <Message>Already a user? <Link to="/login">Login</Link></Message>
        </Grid.Column>

      </Grid>
    );
  }
}

export default Register;
