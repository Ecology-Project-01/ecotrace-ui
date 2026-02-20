import { Provider } from 'react-redux';
import { store } from './store/store';
import Home from './screens/Home';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
