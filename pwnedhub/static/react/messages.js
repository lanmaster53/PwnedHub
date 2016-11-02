// dynamic URLs via template

var MessagesComponent = React.createClass({
    getInitialState() {
        return { messages: [] };
    },
    loadMessagesFromServer() {
        axios.get(
            "/api/messages"
        )
        .then(function(response) {
            this.setState({ messages: response.data.messages });
        }.bind(this))
        .catch(function (error) {
            console.log(error);
        });
    },
    componentDidMount() {
        this.loadMessagesFromServer();
        // uncomment to enable live updates
        //setInterval(this.loadMessagesFromServer, 2000);
    },
    handleMessageSubmit(message) {
        axios.post(
            "/api/messages",
            message
        )
        .then(function(response) {
            this.setState({ messages: response.data.messages });
        }.bind(this))
        .catch(function (error) {
            console.log(error);
        });
    },
    handleMessageDelete(id) {
        axios.delete(
            "/api/messages/" + id
        )
        .then(function(response) {
            this.setState({ messages: response.data.messages });
        }.bind(this))
        .catch(function (error) {
            console.log(error);
        });
    },
    render() {
        return (
            <div>
                <div className="row">
                    <MessageForm
                        onMessageSubmit={this.handleMessageSubmit}
                    />
                </div>
                <MessageList
                    messages={this.state.messages}
                    onDeleteMessage={this.handleMessageDelete}
                />
            </div>
        );
    }
});

var MessageForm = React.createClass({
    getInitialState() {
        return { message: "" };
    },
    handleFormSubmit(e) {
        e.preventDefault();
        if (this.props.onMessageSubmit) {
            this.props.onMessageSubmit({message: this.state.message});
            this.setState({ message: "" });
        }
    },
    onChange() {
        this.setState({ message: this.refs.inputElement.value });
    },
    inputStyle: {
        float: "right"
    },
    spanStyle: {
        display: "block",
        overflow: "hidden",
        paddingRight: "10px"
    },
    render() {
        return (
            <div className="ten columns offset-by-one center-content">
                <form onSubmit={this.handleFormSubmit}>
                    <input style={this.inputStyle} type="submit" value="submit" />
                    <span style={this.spanStyle}>
                        <input
                            ref="inputElement"
                            className="u-full-width"
                            type="text"
                            value={this.state.message}
                            placeholder="message here..."
                            onChange={this.onChange}
                        />
                    </span>
                </form>
            </div>
        );
    }
});

var MessageList = React.createClass({
    getInitialState() {
        return { hoveringOn: null };
    },
    handleMouseEnter(i) {
        this.setState({ hoveringOn: i });
    },
    handleMouseLeave(i) {
        this.setState({ hoveringOn: null });
    },
    render() {
        return (
            <div className="row">
                <div className="ten columns offset-by-one messages">
                    {this.props.messages.map(
                        function(message, i) {
                            return (
                                <div
                                    onMouseEnter={this.handleMouseEnter.bind(this, i)}
                                    onMouseLeave={this.handleMouseLeave}
                                >
                                    <MessageDelete
                                        enabled={this.state.hoveringOn === i}
                                        message={message}
                                        onDeleteMessage={this.props.onDeleteMessage}
                                        key={'1-'+i}
                                    />
                                    <Message
                                        message={message}
                                        key={'2-'+i}
                                    />
                                </div>
                            );
                        }, this
                    )}
                </div>
            </div>
        );
    }
});

var MessageDelete = React.createClass({
    handleDeleteClick(e) {
        e.preventDefault();
        if (this.props.onDeleteMessage) {
            this.props.onDeleteMessage(this.props.message.id);
        }
    },
    render() {
        // prevent the componenet from mounting unless it is
        // owner by the current user and the message is hovered over
        if (!(this.props.message.is_owner && this.props.enabled)) {
            return false;
        };
        return (
            <div className="delete" onClick={this.handleDeleteClick}>
                <img src="/images/trash.png" />
            </div>
        );
    }
});

var Message = React.createClass({
    getMessageStyle() {
        // set an inline style if the message is owned by the current user
        if (this.props.message.is_owner == true) {
            return { fontWeight: "bold" };
        };
        return {};
    },
    render() {
        return (
            <div style={this.getMessageStyle()}>
                <p><span className="red">{this.props.message.user}</span></p>
                <p dangerouslySetInnerHTML={{__html: this.props.message.comment}}></p>
                <p>{this.props.message.created}</p>
            </div>
        );
    }
});

ReactDOM.render(
    <MessagesComponent />,
    document.getElementById("react-container")
);
