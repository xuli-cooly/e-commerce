package email

import (
	"crypto/tls"
	"fmt"
	"net/smtp"

	"auth-service/config"
)

// SendVerifyCode 通过163 SMTP 发送验证码邮件
func SendVerifyCode(to, code string) error {
	cfg := config.Global.Email

	subject := "【交易系统】登录验证码"
	body := fmt.Sprintf(
		"您的登录验证码为：<b>%s</b>，5分钟内有效，请勿泄露给他人。",
		code,
	)

	msg := "From: " + cfg.Sender + "\r\n" +
		"To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"\r\n" + body

	auth := smtp.PlainAuth("", cfg.Sender, cfg.AuthCode, cfg.SMTPHost)
	addr := fmt.Sprintf("%s:%d", cfg.SMTPHost, cfg.SMTPPort)

	// 163 SMTP 465端口使用 SSL，需要 tls.Dial 而非 smtp.SendMail
	tlsCfg := &tls.Config{ServerName: cfg.SMTPHost}
	conn, err := tls.Dial("tcp", addr, tlsCfg)
	if err != nil {
		return fmt.Errorf("smtp tls dial: %w", err)
	}
	client, err := smtp.NewClient(conn, cfg.SMTPHost)
	if err != nil {
		return fmt.Errorf("smtp new client: %w", err)
	}
	defer client.Close()

	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("smtp auth: %w", err)
	}
	if err = client.Mail(cfg.Sender); err != nil {
		return fmt.Errorf("smtp mail from: %w", err)
	}
	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("smtp rcpt to: %w", err)
	}
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp data: %w", err)
	}
	if _, err = fmt.Fprint(w, msg); err != nil {
		return fmt.Errorf("smtp write: %w", err)
	}
	return w.Close()
}
