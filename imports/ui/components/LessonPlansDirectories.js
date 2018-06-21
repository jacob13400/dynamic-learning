import React, { Component } from 'react';
import SortableTree, { getTreeFromFlatData} from 'react-sortable-tree';
import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import 'react-sortable-tree/style.css';
import { LessonPlans } from '../../api/lessonplans'
import { Link } from 'react-router-dom'

import { Button, Modal, Form} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';

import FaTrash from 'react-icons/lib/fa/trash'
import FaEdit from 'react-icons/lib/fa/edit'

import FileExplorerTheme from 'react-sortable-tree-theme-file-explorer';
 

/*This component displays the lessonplan files in nested tree structure.
    You will be able to create directories and add lessonplans to it.
    Deletion of a directory will result in the deletion of all the directories in it
    along with the lessonplans in all of the nested directories 
    and the main directory.
*/

export default class LessonPlansDirectories extends Component {

  constructor(props) {
    super(props)

    this.state = {
        
      treeData: [],
      modalOpen: false,
      modal2Open:false
    }
  }

  componentDidMount() {

      Meteor.subscribe('lessonplans')

      this.lessonplansTracker = Tracker.autorun(()=>{
        
        const lessonplans = LessonPlans.find().fetch()

        /* Here we fetch two things, all the lessonplans and all directory data */
        
        const flatData = LessonPlans.find({userId: Meteor.userId()}).fetch()
        const getKey = node => node._id
        const getParentKey = node => node.parent_id
        const rootKey = '0'        

        const treeData = getTreeFromFlatData({
            flatData,
            getKey,
            getParentKey,
            rootKey
        })

        this.setState({
            treeData
        })   
    })
  }

  componentWillUnmount() {
    this.lessonplansTracker.stop()
  }

  addNewFolder(e) {   

    e.preventDefault()
    
    /* New directory is created here.*/

    if(!this.folderName.value)
        return

    this.handle2Close()

    Meteor.call('lessonplans.folder.insert', this.folderName.value)

    this.folderName.value = ''


  }


  addNewLessonPlan() {

    if(!this.lessonPlanName.value)
        return

    this.handleClose()

    Meteor.call('lessonplans.insert', this.lessonPlanName.value) 

    this.lessonPlanName.value = ''

  }

  handleOpen = () => this.setState({ modalOpen: true })
  handleClose = () => this.setState({ modalOpen: false })

  handle2Open = () => this.setState({ modal2Open: true })
  handle2Close = () => this.setState({ modal2Open: false })

  render() {


    const getNodeKey = ({ treeIndex }) => treeIndex;
    
    const canDrop = ({ node, nextParent, prevPath, nextPath }) => {

        /* To prevent a file to be added as a child of a file 
            and to prevent a directory to be added as a child of a file.
        */
  
        if (node && nextParent) {
            if(node.isFile && nextParent.isFile)
                return false
        }
  
        if (node && nextParent) {
            if(!node.isFile && nextParent.isFile)
                return false
        }
  
        return true;
    }

    const removeLessonPlansInside = node => {

        /* The deletion takes place recursively.
            If the node is a file, using the id in it, it is removed
            from the database.
            If the node has no children, returned otherwise
            we recursively move to the children nodes.
        */

        if(node.isFile) {

            Meteor.call('lessonplans.remove', node._id)
            return
            
        }

        if(node.children.length == 0) {
            return
        }
        else {
            node.children.map(child => {
                removeLessonPlansInside(child)
            })
        }        

    }

    return ( 

        <div>   

             <Modal 

                trigger = {<Button onClick={this.handleOpen} >Create new lessonplan</Button>}
                open={this.state.modalOpen}
                onClose={this.handleClose}
                size='tiny'            
             >
                <Modal.Header>Lessonplan details</Modal.Header>

                <Modal.Content>
                    <Modal.Description>

                        <Form onSubmit = {this.addNewLessonPlan.bind(this)}>

                            <Form.Field>
                                <label>Name</label>
                                <input ref = { e => this.lessonPlanName = e } placeholder='Name' />
                            </Form.Field>
                      
                            <Button type='submit'>
                                Submit
                            </Button>

                            <Button onClick = {this.handleClose}>
                                Close
                            </Button>
                       
                        </Form>
                    </Modal.Description>
                    
                </Modal.Content>              

            </Modal>


             <Modal 

                trigger = {<Button onClick={this.handle2Open} >Create a folder</Button>}
                open={this.state.modal2Open}
                onClose={this.handle2Close}
                size='tiny'            
                >
                <Modal.Header>New folder</Modal.Header>

                <Modal.Content>
                    <Modal.Description>

                        <Form onSubmit = {this.addNewFolder.bind(this)}>

                            <Form.Field>
                                <label>Name</label>
                                <input ref = { e => this.folderName = e } placeholder='Name' />
                            </Form.Field>
                    
                            <Button type='submit'>
                                Submit
                            </Button>

                            <Button onClick = {this.handle2Close}>
                                Close
                            </Button>
                    
                        </Form>
                    </Modal.Description>
                    
                </Modal.Content>              

                </Modal>

            <div style={{ height: 400, padding:'1.6rem' }}>        
                
                <SortableTree
                    onVisibilityToggle = {({treeData, node, expanded}) => {
                        Meteor.call('lessonplans.folder.visibilityChange', node._id, expanded)
                    }}
                    theme = {FileExplorerTheme}
                    canDrop={canDrop}                    
                    treeData={this.state.treeData}
                    onChange={treeData => this.setState({ treeData })}
                    onMoveNode = { args => {

                            if(args.nextParentNode) {
                                
                                Meteor.call('lessonplans.directoryChange', args.node._id, args.nextParentNode._id)
                                Meteor.call('lessonplans.folder.visibilityChange', args.nextParentNode._id, true)
                            }
                            else {

                                Meteor.call('lessonplans.directoryChange', args.node._id, '0')
                            }             
                        }             
                    }

                    generateNodeProps={({ node, path }) => ({
                        buttons: [

                        <button
                            
                            className = 'icon__button'
                            style = {{visibility:node.isFile?'visible':'hidden'}}>

                            <Link to ={{ pathname: `/createlessonplan/${node._id}`}}>
                               <FaEdit size={17} color="black" />
                            </Link>

                        </button>,

                        <button
                        
                            className = 'icon__button'
                            onClick={() =>{

                                    const input = confirm('Are you sure you want to perform this deletion?')
                                    if(!input)
                                        return

                                    if(!node.isFile) {
                                        removeLessonPlansInside(node)                                
                                    }
                                    
                                    Meteor.call('lessonplans.remove', node._id)
                                }
                            }
                        >
                            <FaTrash size={17} color="black"/>

                        </button>
                        ]
                    })}
                />

            </div>

        </div>
    )
  }
}