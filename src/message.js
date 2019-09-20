import React from "react";
import io from "socket.io-client";

export class Message extends React.Component<Props, State> {
    constructor(props: Props){
        super(props);

        this.state = {
            id : props.id,
            username: props.username,
            message: props.message,
            auto: props.auto
        };
        
        this.socket = io('localhost:5000');
        
        
        this.readMessage = this.readMessage.bind(this);
        
        if(this.state.auto)
        {
            this.readMessage();
        }
    }
    
    readMessage() {
        this.socket.emit('READ_MESSAGE', { message : this.state.message});
    }
    
    render(){
        return ( 
            <div data-id={this.state.id}><button onClick={this.readMessage}>Read</button> {this.state.username} : {this.state.message}</div>
        );
    }
}