import React from 'react';
import './InputField.css'; // Create this CSS file

const InputField = ({ label, type = 'text', value, onChange, placeholder, error }) => {
    return (
        <div className="input-group">
            <label className="input-label">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`input-field ${error ? 'input-error' : ''}`}
            />
            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
};

export default InputField;