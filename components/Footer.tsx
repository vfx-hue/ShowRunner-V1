
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="w-full py-6 mt-auto border-t border-slate-100 bg-white/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 flex justify-center items-center">
                <Link
                    to="/niche-fantasy"
                    className="text-sm font-medium text-slate-400 hover:text-purple-600 transition-colors duration-300 flex items-center gap-2"
                >
                    <span>Made by Niche Fantasy Sports</span>
                </Link>
            </div>
        </footer>
    );
};

export default Footer;
