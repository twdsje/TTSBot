import React from "react";
import io from "socket.io-client";
import {Message } from './message';

class Chat extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            username: '',
            message: '',
            messages: [],
            auto: false
        };
        
        this.socket = io('localhost:5000');
        
        this.socket.on('RECEIVE_MESSAGE', function(data){
            addMessage(data);
        });

        const addMessage = data => {
            console.log(data);
            this.setState({messages: [...this.state.messages, data]});
            this.messagesEnd.scrollIntoView({ behavior: "smooth" })
            console.log(this.state.messages);
        };
        
        this.sendMessage = ev => {
            ev.preventDefault();
            this.socket.emit('SEND_MESSAGE', {
                username: this.state.username,
                message: this.state.message
            });
            //this.setState({message: ''});
        }
        
        this.handleInputChange = this.handleInputChange.bind(this);
    }
    
    handleInputChange(event) {
      const target = event.target;
      const value = target.type === 'checkbox' ? target.checked : target.value;
      const name = target.name;

      this.setState({
        [name]: value
      });
    }
    
    render(){
        return (
            <div className="container-fluid">
            
            <p>
  <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
    Expand
  </button>
</p>
<div class="collapse" id="collapseExample">
  <div class="card card-body">
                                    <div className="header">
                                    <input type="text" placeholder="Username" value={this.state.username} onChange={ev => this.setState({username: ev.target.value})} className="form-control"/>
                                    <br/>
                                    <input type="text" placeholder="Message" className="form-control" value={this.state.message} onChange={ev => this.setState({message: ev.target.value})}/>
                                    <br/>
                                    <button onClick={this.sendMessage} className="btn btn-primary form-control">Send</button>
                                </div>
  </div>
</div>
            
                        <div className="card">
                            <div className="card-body">
                                <div className="card-title">Global Chat</div>
                                <hr/>
                                <div className="messages">
                                    {this.state.messages.map((message, i) => 
                                        <Message username={message.username} message={message.message} id={i} auto={this.state.auto} />
                                    )}
                                </div>
                            
                                <div className="header" ref={(el) => { this.messagesEnd = el; }}>
                                    <label>Auto Read <input name="auto" type="checkbox" checked={this.state.auto} onChange={this.handleInputChange} /></label>
                                </div>
                                
                                
                            </div>
                        </div>
            </div>
        );
    }
}

export default Chat;