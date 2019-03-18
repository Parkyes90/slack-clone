import React, {Component} from 'react';
import { Menu } from "semantic-ui-react";
import UserPanel from './UserPanel';
import Channels from './Channels';
import DirectMessages from "./DirectMessages";
import Starred from "./Starred";

class SidePanel extends Component {
  render() {
    const { currentUser } = this.props;
    return (
      <Menu
        size="large"
        inverted
        fixed="left"
        vertical
        style={{background: '#4c3c4c', fontsize: '1.2rem'}}
      >
        <UserPanel currentUser={currentUser}/>
        <Starred currentUser={currentUser}/>
        <Channels currentUser={currentUser}/>
        <DirectMessages currentUser={currentUser}/>
      </Menu>
    );
  }
}

export default SidePanel;
