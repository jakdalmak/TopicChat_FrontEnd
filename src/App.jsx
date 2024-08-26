import "./output.css";
import ChatPage from "./Page/ChatPage";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import TopicListUpPage from "./Page/TopicListUpPage";

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/ChatRoom/:chatRoomId">
          <div className="App min-h-full w-full">
            <ChatPage />
          </div>
        </Route>
        <Route exact path="/">
          <TopicListUpPage />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
