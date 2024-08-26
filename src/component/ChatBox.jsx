import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import useStore from "../Store/useStore.jsx";

const ChatBox = ({ userId, userName, text }) => {
  const currentUserId = useStore((state) => state.user.id);

  useEffect(() => {
    setCSSByWhosChat(userId);
  }, []);

  const [direction, setDirection] = useState("middle");
  const [message, setMessage] = useState("전달되지 않음");
  const [bgColor, setbgColor] = useState("bg-black");
  const [isMineChat, setIsMineChat] = useState(false); // 내 채팅이 아니라면, ChatBox는 채팅 제공자의 닉네임을 보여주어야 한다.

  const setCSSByWhosChat = (userId) => {
    setMessage(text);

    if (userId === currentUserId) {
      setbgColor("bg-emerald-300");
      setDirection("mr-auto");
      setIsMineChat(true);
    } else {
      setbgColor("bg-sky-500/50");
      setDirection("ml-auto");
      setIsMineChat(false);
    }
  };

  return isMineChat ? (
    <div
      className={`${direction} mt-6 p-3.5 max-w-sm rounded-xl shadow-sm flex items-center space-x-4 font-medium ${bgColor}`}
    >
      {message}
    </div>
  ) : (
    <>
      <div>{userName}</div>
      <div
        className={`${direction} mt-6 p-3.5 max-w-sm rounded-xl shadow-sm flex items-center space-x-4 font-medium ${bgColor}`}
      >
        {message}
      </div>
    </>
  );
};

ChatBox.propTypes = {
  userId: PropTypes.string.isRequired,
  userName: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

export default ChatBox;
