
import '../App.css';
import '../normal.css';
import { useState }  from 'react';
import ChatBox from '../components/ChatBox';
import Admin from '../components/Admin';
import Hamburger from 'hamburger-react';


// set up state variables to hold the chat log
function Chat() {

  const [file , setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [input, setInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  function showNavbar() {
   const navbar = document.querySelector('.chat-nav');
   navbar.style.display === 'flex' ? navbar.style.display = 'none' :
   navbar.style.display = 'flex';
  }

  //Clear chat log
function clearChat() {
  setChatLog([]);
}

//Upload file
function onFileChange(e) {
 setFile(e.target.files[0]);
}

//Toggle admin panel
function toggleAdmin() {
 const admin = document.querySelector('.files');
 admin.style.display === 'block' ? admin.style.display = 'none' :
 admin.style.display = 'block';
}

//Handle admin submit
async function handleAdminSubmit(e) {
 e.preventDefault();
 setIsUploading(true);

 const formData = new FormData();
 formData.append('file', file);

   const response = await fetch('http://localhost:3080/admin', {
   method: 'POST',
   body: formData
   });
   const status = await response.json();
     setIsUploading(false);
     setStatus(status.error);
}


//Handle submit when chat is submitted
async function handleSubmit(e) {
    e.preventDefault();
    let chatLogNew = [...chatLog, { user: "me", message: `${input}`}];
    setInput('');
    setChatLog(chatLogNew);
    setIsLoading(true);

    const messages = chatLogNew.map((message) => message.message);  
    const response = await fetch('http://localhost:3080/chat', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({ messages }),
     });
     const data = await response.json();
     setChatLog([...chatLogNew, { user: 'gpt', message: data.message }]);
     setIsLoading(false);
}

//Render chat
  return (
   
    <div className="App">
     <div className='nav'><Hamburger onToggle={showNavbar} color='#fff' size={20} /></div>
     <div className='chat-nav'>
       <img src="lillesandogbirkenes.jpg" alt="" />
       <div>
       <button onClick={clearChat} className='clear-btn'>Ny Samtale</button> 
       <button onClick={toggleAdmin} className='clear-btn admin'>Admin</button>
       </div>
     </div>
     <div className='line'></div>
     <Admin isUploading={isUploading} onFileChange={onFileChange} handleAdminSubmit={handleAdminSubmit} />
      <ChatBox chatLog={chatLog} isLoading={isLoading} handleSubmit={handleSubmit} input={input} setInput={setInput} />
      </div>
  );
}

export default Chat;