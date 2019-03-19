import React, {Component} from 'react';
import {
  Grid,
  Header,
  Icon,
  Dropdown,
  Image,
  Modal,
  Input, Button
} from "semantic-ui-react";
import AvatarEditor from 'react-avatar-editor';
import firebase from '../../firebase';

class UserPanel extends Component {
  state = {
    user: this.props.currentUser,
    modal: false,
    previewImage: '',
    croppedImage: '',
    blob: '',
    storageRef: firebase.storage().ref(),
    userRef: firebase.auth().currentUser,
    metaData: {
      contentType: 'image/jpeg'
    },
    usersRef: firebase.database().ref('users'),
    uploadedCroppedImage: ''
  };

  openModal = () => {
    this.setState( {modal: true});
  };

  closeModal = () => {
    this.setState( {modal: false});
  };

  componentWillReceiveProps(nextProps, nextContext) {
    this.setState({ user: nextProps.currentUser })
  }

  dropdownOptions = () => [
    {
      key: "user",
      text: <span>Signed in as <strong>{this.state.user.displayName}</strong></span>,
      disabled: true
    },
    {
      key: "avatar",
      text: <span onClick={this.openModal}>Change Avatar</span>
    },
    {
      key: "signOut",
      text: <span onClick={this.handleSignOut}>Sign Out</span>,
    }
  ];

  handleSignOut = () => {
    firebase
      .auth()
      .signOut()
      .then(() => console.log('signed out!'))
  };

  handleChange = event => {
    const file = event.target.files[0];
    const reader = new FileReader();

    if (file) {
      reader.readAsDataURL(file);
      reader.addEventListener('load', () => {
        this.setState({ previewImage: reader.result });
      });
    }
  };

  handleCropImage = () => {
    if (this.avatarEditor) {
      this.avatarEditor.getImageScaledToCanvas().toBlob(blob => {
        let imageUrl = URL.createObjectURL(blob);
        this.setState({
          croppedImage: imageUrl,
          blob
        })
      })
    }
  };

  uploadCroppedImage = () => {
    const { storageRef, userRef, blob, metaData } = this.state;
    storageRef
      .child(`avatars/user-${userRef.uid}`)
      .put(blob, metaData)
      .then(
        snap => {
          snap.ref.getDownloadURL().then(downloadURL => {
            this.setState( {uploadedCroppedImage: downloadURL}, () => this.changeAvatar());
          });
        }
      )
  };

  changeAvatar = () => {
    this.state.userRef
      .updateProfile({
        photoURL: this.state.uploadedCroppedImage
      })
      .then(() => {
        console.log('PhotoURL updated');
        this.closeModal()
      })
      .catch(err => {
        console.error(err);
      });

    this.state.usersRef
      .child(this.state.user.uid)
      .update({ avatar: this.state.uploadedCroppedImage})
      .then(() => {
        console.log('User Avatar Updated');
      })
      .catch(err => {
        console.error(err);
      })
  };

  render() {
    const { user, modal, previewImage, croppedImage } = this.state;
    const { primaryColor } = this.props;
    return (
      <Grid style={{background: primaryColor}}>
        <Grid.Column>
          <Grid.Row style={{padding: "1.2em", margin: 0}}>
            <Header inverted floated="left" as="h2">
              <Icon name="code" />
              <Header.Content>DevChat</Header.Content>
            </Header>
          </Grid.Row>
          <Header style={{padding: '0.25em'}} as="h4" inverted>
            <Dropdown
              trigger={
                <span>
                  <Image src={user.photoURL} spaced="right" avatar/>
                  {user.displayName}
                </span>
              }
              options={this.dropdownOptions()}
            />
          </Header>
          <Modal basic open={modal} onClose={this.closeModal}>
            <Modal.Header>Change Avatar</Modal.Header>
            <Modal.Content>
              <Input
                fluid
                type="file"
                label="new Avatar"
                name="previewImage"
                onChange={this.handleChange}
              />
              <Grid centered columns={2} stackable>
                <Grid.Row centered>
                  <Grid.Column className="ui center aligned grid">
                    {previewImage && (
                      <AvatarEditor
                        ref={node => (this.avatarEditor = node)}
                        image={previewImage}
                        width={120}
                        height={120}
                        border={50}
                        scale={1.2}
                      />
                    )}
                  </Grid.Column>
                  <Grid.Column>
                    {croppedImage && (
                      <Image
                        style={{margin: '3.5em auto'}}
                        width={100}
                        height={100}
                        src={croppedImage}
                      />
                    )}
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Modal.Content>
            <Modal.Actions>
              {croppedImage &&  <Button color="green" inverted onClick={this.uploadCroppedImage}>
                <Icon name="save"/> Change Avatar
              </Button>}
              <Button color="green" inverted onClick={this.handleCropImage}>
                <Icon name="image"/> Preview
              </Button>
              <Button color="red" inverted onClick={this.closeModal}>
                <Icon name="remove"/> Cancel
              </Button>
            </Modal.Actions>
          </Modal>
        </Grid.Column>
      </Grid>
    );
  }
}


export default UserPanel;
