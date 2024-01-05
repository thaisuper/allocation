import './App.css';
import { caculateStart } from './logic';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <button
          className="App-link"
          onClick={() => caculateStart()}
        >
          Tính toán
        </button>
      </header>
    </div>
  );
}

export default App;
