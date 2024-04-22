
import { RouterProvider } from 'react-router-dom';
import router from './router.jsx';
import AuthProvider from './components/AuthProvider.jsx';


const App = () => {
    return (

        <>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </>
    );
};

export default App;