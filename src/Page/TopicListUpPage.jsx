import { useState, useEffect, useRef } from "react";
import useStore from "../Store/useStore.jsx";
import { useHistory } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import logo from "../assets/logo.png";

const TopicListUpPage = () => {
  /** 이번 주의 카테고리(대분류), 토픽(주제)를 가져오도록 한다. */

  let userInfo = useStore((state) => state.user);
  const setUserInfo = useStore((state) => state.setUser);

  // useStore 내역은
  const setUserSessionId = (sessionValue) => {
    setUserInfo({
      ...userInfo,
      sessionId: sessionValue,
    });
  };

  const history = useHistory();

  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);

  /* 사용자가 선택한 값들을 저장해두는 state */
  const [selectedCategory, selectCategory] = useState("");
  const [selectedTopic, selectTopic] = useState("");

  // 현재 페이지에 위치한 사용자가 매칭 큐에서 대기 중인지, 아닌지 판단한다.
  const [isMatching, setMatching] = useState(false);
  const [isConnected, setConnected] = useState(false); // WebSocket 연결 상태

  const stompClient = useRef(null);
  const matchingSubscribeRef = useRef(null);

  /** WebSocket 연결 및 stomp 구독 설정 */
  const startMatching = async (categoryName) => {
    console.log("WebSocket connected");

    try {
      const response = await fetch(
        `http://localhost:8080/join/queue?category=${categoryName}&userId=${userInfo.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json(); // JSON으로 파싱
      const sessionId = data.sessionId; // JSON 객체에서 sessionId 추출
      console.log(sessionId);
      setUserSessionId(sessionId); // 상태 업데이트
    } catch (error) {
      console.log("error:", error);
      throw error; // 에러가 발생하면 에러를 던져서 catch 블록으로 전달
    }
  };

  const cancleMatching = () => {
    setMatching(false);
  };

  /** WebSocket 및 stomp 연결 해제 */
  const disconnect = () => {
    if (stompClient.current) {
      stompClient.current.deactivate();
      stompClient.current = null;
      console.log("WebSocket disconnected");
    }
  };

  /* 
  webSocket 연결이 특정 category를 선택한 시점부터 수행된다.
  stomp 연결은 
  */
  const matchingClick = async (event) => {
    const categoryName = event.target.getAttribute("value");
    selectCategory(categoryName);

    try {
      await startMatching(categoryName); // startMatching의 완료를 기다림
      setMatching(true); // startMatching이 완료된 후에 상태를 업데이트
    } catch (error) {
      console.error("Matching failed:", error);
    }
  };
  /** 페이지에 진입하면, 이번 주의 카테고리를 가져오도록 한다.
   * 웹소켓 연결 자체도 열어만 두고, subscribe는 수행하지 않는다.
   */
  useEffect(() => {
    fetch(`http://localhost:8080/api/category/weekly`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json()) // JSON으로 파싱
      .then((data) => {
        setCategories(data); // 받아온 카테고리 목록을 저장
        console.log("data:", data);
      })
      .catch((error) => console.log("error:", error));

    const socket = new SockJS("http://localhost:8080/stomp");
    stompClient.current = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        userId: userInfo.id,
      },
    });

    stompClient.current.activate(); // 설정한 Client 내역 기반으로
  }, []);

  useEffect(() => {
    if (isMatching) {
      matchingSubscribeRef.current = stompClient.current.subscribe(
        `/subscribeTopic/matching/category/queue/${selectedCategory}-user${userInfo.sessionId}`,
        (message) => {
          console.log("메시지 잘받았다!");
          const messageAnswer = JSON.parse(message.body);
          console.log(message);
          if (messageAnswer.chatRoomId) {
            disconnect();
            history.push({
              pathname: `/ChatRoom/${messageAnswer.chatRoomId}?category=${selectedCategory}`,
            });
            window.location.reload();
          }
        }
      );
    } else if (matchingSubscribeRef.current) {
      // isMatching이 false이고, matchingSubscribeRef가 존재할때(subscribe가 이루어진 상황)
      matchingSubscribeRef.current.unSubscribe(); // unsubscribe는 구독 객체에 대해 수행하여야 한다.
      matchingSubscribeRef.current = null; // useRef 내역을 초기화한다.
      console.log("매칭 대기열 구독을 취소하였습니다.");
    }
  }, [isMatching]);

  return !isMatching ? (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-2xl font-bold mb-2">
        Topic Chat에 오신걸 환영합니다.
      </h2>
      <h2 className="text-lg text-gray-600 mb-6">
        카테고리를 선택하고, 오늘의 무작위 Topic을 주제삼아 무작위 사용자와
        대화해보세요.
      </h2>

      <img src={logo} alt="Logo" className="mb-8 w-40 h-40" />

      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-xl font-semibold">Category</div>
          <div className="text-xl font-semibold">Topic</div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {categories.map((category, index) => (
            <div key={index}>
              <div
                onClick={matchingClick}
                className="bg-white p-4 rounded shadow cursor-pointer"
                value={category.categoryName}
              >
                {category.categoryName}
              </div>
              <div className="bg-white p-4 rounded shadow">
                <ul>
                  {category.todayTopicList.map((topic, topicIndex) => (
                    <li key={topicIndex}>{topic.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div
      onClick={cancleMatching}
      className="bg-white p-4 rounded shadow cursor-pointer"
    >
      취소하기
    </div>
  );
};

export default TopicListUpPage;
