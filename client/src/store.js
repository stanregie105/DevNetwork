import { createStore,combineReducers, applyMiddleware} from 'redux';
import { composeWithDevTools} from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import logger from 'redux-logger';
import rootReducer from './reducers';

const initialState ={};

const middleware = [thunk, logger];


const store = createStore(combineReducers({
  rootReducer,
  initialState
})
  ,
  applyMiddleware(...middleware)
);

export default store;


