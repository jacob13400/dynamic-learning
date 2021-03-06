import React from 'react';
import 'semantic-ui-css/semantic.min.css';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Button, Form, Modal } from 'semantic-ui-react';

/*
    This component is made to allow teachers to search for students within their school. It will
    be extended to allow teachers to search for students in their class, once that functionality
    is added.
*/

export default class TeacherSearch extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      school: '',
    };

    this.search = ''; // contains the value of the search box
  }

  componentDidMount() {
    Tracker.autorun(() => {
      if (Meteor.user()) {
        this.setState({
          school: Meteor.user().school,
        });
      }
    });

    Meteor.subscribe('getAccounts'); // allows us to get the account info of people from the backend
  }

  // this function tells us when the button has been clicked to search for students

  searched = () => {
    this.setState({
      lookedup: true,
    });
  }

  // this function gets the list of students that match the search criteria and are in
  // the teacher's school

  handleOpen = (user) => {
    this.setState({
      modalOpen: true,
      userClicked: user.username,
      clickedType: user.profile.accountType,
      clickedEmail: user.emails[0].address,
    });
  }

  getStudents = () => (
    Meteor.users.find().fetch()
      .map((user) => {
        const { school } = this.state;
        if (this.search !== '' && user.username !== undefined
          && user.school !== undefined && user.school === school
          && user.username.includes(this.search)) {
          return (
            <div onClick={() => this.handleOpen(user)} style={{ paddingTop: '5px' }}>
              {
                user.username
              }
            </div>
          );
        }
      })
  )

  handleClose = () => {
    this.setState({
      modalOpen: false,
    });
  }
  // form for searching

  render() {
    const {
      lookedup, modalOpen, userClicked, clickedType, clickedEmail,
    } = this.state;
    return (
      <div>
        <Form noValidate onSubmit={this.searched} style={{ marginTop: '1.2rem', width: '25%' }}>
          <Form.Field>
            <label> Search for a student in your school by username </label>
            <input onChange={(e) => { this.search = e.target.value; }} />
            <Button type="submit" style={{ marginTop: '1.2rem' }}> Search </Button>
          </Form.Field>
        </Form>
        {
          lookedup && this.getStudents()
        }
        <Modal
          open={modalOpen}
          onClose={() => this.handleClose()}
          size="tiny"
        >
          <Modal.Header>
            {userClicked}
            <Button className="close-button" onClick={() => this.handleClose()}>
              X
            </Button>
          </Modal.Header>

          <Modal.Content>
            <Modal.Description>
              Account Type:
              {' '}
              {clickedType}
              {' '}
              <br />
              Email:
              {' '}
              {clickedEmail}
            </Modal.Description>

          </Modal.Content>

        </Modal>
      </div>
    );
  }
}
