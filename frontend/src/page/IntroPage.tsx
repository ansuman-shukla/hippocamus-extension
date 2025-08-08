import Button from "../components/Button";
import Logo from '../assets/Logo.svg'
import '../index.css'
import { useNavigate } from 'react-router-dom';
import {motion} from 'framer-motion';
import { useSimpleAuth } from '../components/SimpleAuth';
import { useState } from 'react';

const Intro = () => {
    const Navigate = useNavigate();
    const { login } = useSimpleAuth();
    const [error, setError] = useState('');

    const handleAuth = async () => {
        console.log('🚀 Initiating simplified authentication');
        setError(''); // Clear any previous errors
        
        const result = await login();
        if (result.success) {
            Navigate("/submit");
        } else {
            console.error('❌ Login failed:', result.error);
            setError(result.error || 'Authentication failed');
        }
    };

    return (
        <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "ease" }}
        className="h-[500px] w-[100%] relative rounded-lg overflow-hidden">

          <div className="absolute inset-0 flex">
            <div className="w-1/4 bg-[var(--primary-orange)]" />
            <div className="w-1/4 bg-[var(--primary-green)]" />
            <div className="w-1/4 bg-[var(--primary-yellow)]" />
            <div className="w-1/4 bg-[var(--primary-blue)]" />
          </div>

          <div className="relative h-[500px] w-[419px] flex my-auto justify-center rounded-lg">
            <div className="flex flex-col items-center text-center space-y-8 p-6 mx-6 my-auto rubik">

              <div className="flex items-center mb-16">
                <img src={Logo} alt="" className="pl-6"/>
              </div>

              <p className="text-4xl rubik max-w-md">
                "Every bookmark is a doorway to a new journey"
              </p>

              {error && (
                <div className="text-red-500 text-sm max-w-md">
                  {error}
                </div>
              )}

              <Button handle={handleAuth} text="GET STARTED" textColor="--primary-white" variant="close" className="rubik"/>
            </div>
          </div>
        </motion.div>
    );
};

export default Intro;
