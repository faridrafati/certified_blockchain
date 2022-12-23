import React, { Component } from 'react';
import { Route, Redirect, Switch } from "react-router-dom";
import CoderToken from './coderToken';
import './App.css';
import VotingContract from './votingContract';
import NavBar from './navBar';
import NotFound from './notFound';
import CertChat from './CertChat';
import Task from './Task';
import Auction from './Auction';
import WeightedVoting from './WeightedVoting';
import Certificate from './certificate';
import BlockchainPoll from './blockchainPoll';
import PetShop from './petShop';
import ModalForm from './modalForm';
import Provider from './provider';


class App extends Provider {

  state = {
    currentAccount : null,
    ethBalance:'',
    chainId:'', 
    message:'Please Wait',
    buttonName:'Ok',
    modalNeed: true,
    AppNavbar :       
    <React.Fragment>
    <NavBar />
    <main className='container'>
      <Switch>
        <Route path="/token" component={CoderToken}/>
        <Route path="/voting" component={VotingContract} />
        <Route path="/weightedVoting" component={WeightedVoting} />
        <Route path="/chat" component={CertChat} />
        <Route path="/todo" component={Task} />
        <Route path="/auction" component={Auction} />
        <Route path="/certificate" component={Certificate} />
        <Route path="/pollSurvey" component={BlockchainPoll} />
        <Route path="/petAdoption" component={PetShop} />
        <Route path="/not-found" component={NotFound} />
        <Redirect from="/" exact to="/token" />
        <Redirect to="/not-found" />
      </Switch>
    </main>
    </React.Fragment>
  }

  render() {
    return (
      <div>
        {(this.state.modalNeed===true?<ModalForm message={this.state.message} buttonName={this.state.buttonName} onClick={this.onClickConnect}/>:<div>{this.state.AppNavbar}</div>)}
      </div>
    );
  }
}

export default App;