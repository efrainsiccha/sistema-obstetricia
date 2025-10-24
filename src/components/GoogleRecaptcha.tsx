import ReCAPTCHA from "react-google-recaptcha";
import { forwardRef } from "react";

interface GoogleRecaptchaProps {
  onChange: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
}

const GoogleRecaptcha = forwardRef<ReCAPTCHA, GoogleRecaptchaProps>(
  ({ onChange, onExpired, onError }, ref) => {
    const siteKey = "6LfyF_YrAAAAAAbCrxT7e4xB8oB0Wrj7ybbv1FJc";

    return (
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={ref}
          sitekey={siteKey}
          onChange={onChange}
          onExpired={onExpired}
          onError={onError}
          theme="light"
          size="normal"
        />
      </div>
    );
  }
);

GoogleRecaptcha.displayName = "GoogleRecaptcha";

export default GoogleRecaptcha;