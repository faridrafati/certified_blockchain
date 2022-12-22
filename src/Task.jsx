import React, { Component } from 'react';
import Web3 from 'web3/dist/web3.min';
import {TextField,Button} from '@mui/material';
import {TODO_TOKEN_ABI,TODO_TOKEN_ADDRESS} from './components/TodoConfig';
import Listing from './Listing';

class Task extends Component {
    state = {
        web3:new Web3(Web3.givenProvider || 'http://localhost:8545'),
        network:'',
        todoContract:'',
        isMetaMask:'', 
        tasks:[],
        input:"",
        account:"",
        status:''
    }

    componentDidMount() {
        this.tokenContractHandler();
    }
    tokenContractHandler = async () => {
        await this.initWeb();
        await this.initContract();
        await this.getAllTasks();
    }
    
    initWeb = async () => {
        let {web3} = this.state;
        const network = await web3.eth.net.getNetworkType();
        const accounts = await web3.eth.getAccounts();
        let account = accounts[0];
        this.setState({web3,network,account});
    }

    initContract = async () => {
        let {web3} = this.state;
        let todoContract = new web3.eth.Contract(TODO_TOKEN_ABI,TODO_TOKEN_ADDRESS);
        let isMetaMask = await web3.currentProvider.isMetaMask;
        this.setState({todoContract,isMetaMask});
    }

    inputHandler = (e) => {
        let input = this.state.input;
        input = e.currentTarget.value;
        this.setState({input});
    }

    addTasks = async (e) => {
        let {input,todoContract,account} = this.state;
        e.preventDefault();
        let task = {
            'taskText':input,
            'isDeleted':false
        }
        
        await todoContract.methods.addTask(task.taskText,task.isDeleted).send({from: (account), gas: '1000000'},(error) => {
            if(!error){
                console.log('task has been added');
            }else{
              console.log("err-->"+error);
            }  
        });
    }

    deleteTask = async(taskId) => {
        let {todoContract,account} = this.state;
        await todoContract.methods.deleteTask(taskId,true).send({from: (account), gas: '1000000'},(error) => {
            if(!error){
                console.log('task has been deleted');
            }else{
              console.log("err-->"+error);
            }  
        });
    }

    getAllTasks =async() => {
        let {todoContract,account} = this.state;
        let tasks = await todoContract.methods.getMyTasks().call({from: account});
        this.setState({tasks});
    }

    render() {
        let {input,tasks} = this.state;
        
        return (
            <div>
                <h2>Task Management App</h2>
                <form>
                    <TextField id='outlined-basic' label='Make Todo' variant='outlined' style={{margin:'0px 5px'}} size='small' value={input} onChange = {this.inputHandler} />
                    <Button variant='contained' color='primary' onClick={this.addTasks}>Add Task</Button>
                    <br /><br />
                </form>
                <ul>
                    {tasks.map(task=>(
                        <Listing key = {task.id} taskText={task.taskText} onClick={() => this.deleteTask(task.id)}/>
                    ))}
                </ul>
            </div>
        );
    }
}
 
export default Task;
