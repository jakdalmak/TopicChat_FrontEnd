import { useParams, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import useStore from "../Store/useStore.jsx";
import ChatBox from "../component/ChatBox";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

function ChatPage() {
  // chatRoomId == kafka topic name으로 사용된다.
  const { chatRoomId } = useParams(); // pathVariable을 통해 가지고 오는 채팅방 id
  const location = useLocation();
  const requestParams = new URLSearchParams(location.search);

  const client = useRef(null);
  const [messages, setMessages] = useState([
    { id: Date.now(), text: Date.now().toString() },
  ]);
  const [wsResponse, setWsResponse] = useState({});

  /** 페이지 UI 설정을 위해 필요한 일부 값 저장 */
  const category = requestParams.get("category");
  const topic = requestParams.get("topic");

  /** useStore에서 관리되는 사용자 정보 '구독하기' */
  let userInfo = useStore((state) => state.user);
  // const setUserInfo = useStore((state) => state.setUser);

  // useStore 내역은 매칭 페이지에서 설정 예정.
  // 이로 인해 임시적으로 사용하기 위한 값들을 구현해둔다.
  // const changeUserName = (event) => {
  //   setUserInfo({
  //     ...userInfo,
  //     nickName: event.target.value,
  //   });
  // };

  /** 웹소켓 연결 및 메시지 리스너(구독) 관련 내역 useEffect*/
  useEffect(() => {
    const connect = () => {
      client.current = new Client({
        webSocketFactory: () => new SockJS("http://localhost:8080/stomp"),
        debug: function (str) {
          console.log(str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log("Connected");
          if (client.current) {
            client.current.subscribe(
              `/subscribeTopic/${chatRoomId}`,
              (message) => {
                console.log("Message Received:", message.body);
                const messageJson = JSON.parse(message.body);
                setWsResponse({
                  userId: messageJson.userId,
                  userName: messageJson.userName,
                  message: messageJson.message,
                });
              }
            );
          }
        },
        onStompError: (frame) => {
          console.error(frame);
        },
      });

      client.current.activate();
    };

    const disconnect = () => {
      if (client.current) {
        client.current.deactivate();
      }
    };

    connect();

    return () => {
      disconnect();
    };
  }, []);

  /** server to client 받는 메시지 */
  useEffect(() => {
    const newMessage = {
      userId: wsResponse.userId,
      userName: wsResponse.userName,
      text: wsResponse.message,
      id: Date.now(),
    };
    setMessages([...messages, newMessage]);
  }, [wsResponse]);

  /** client to server 전달하는 메시지 */
  const sendMessage = () => {
    // console.log(event.target.value);
    console.log(currentMessage);
    if (currentMessage.trim() !== "") {
      const newMessage = {
        userId: userInfo.id,
        userName: userInfo.nickName,
        text: currentMessage,
        id: Date.now(),
      };

      // setMessages([...messages, newMessage]);

      client.current.publish({
        destination: `/sendTopic/Send/${chatRoomId}`,
        body: JSON.stringify({
          userId: newMessage.userId,
          tempName: newMessage.userName,
          message: newMessage.text,
        }),
        headers: { "content-type": "application/json" },
      });
      setCurrentMessage("");
    }
  };

  /** testTopic이라는 이름의 리스너를 설정한다. */
  // const getConnected = () => {
  //   fetch(
  //     `http://localhost:8080/chatroom/${chatRoomId}?category=${selectedCategory}&topic=${selectedTopic}}&groupId=123`,
  //     {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         category: "Test",
  //         topic: "Testing!",
  //         groupId: 1,
  //       }),
  //     }
  //   )
  //     .then((response) => console.log("response:", response))
  //     .catch((error) => console.log("error:", error));
  // };

  const [currentMessage, setCurrentMessage] = useState("");

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-blue-500 text-white p-4 text-lg">
        {category} {topic}
      </div>
      {/* <button onClick={getConnected}>카프카 토픽, 리스너 만들게요</button> */}
      {/* 사용자 이름 지정할래요
      <input type="text" onChange={changeUserName} /> */}
      <div className="flex-1 overflow-auto p-4">
        {messages.map((message) => (
          <ChatBox
            key={message.id}
            userId={message.userId}
            userName={message.userName}
            text={message.text}
          />
        ))}
      </div>
      <div className="p-4">
        <input
          type="text"
          className="border p-2 rounded w-full"
          placeholder="메시지 입력..."
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-blue-500 text-white p-2 mt-2 rounded w-full"
          onClick={sendMessage}
        >
          전송
        </button>
      </div>
    </div>
  );
}

export default ChatPage;
