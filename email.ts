import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// 이메일 전송을 위한 트랜스포터 설정
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * 저재고 알림 이메일 전송
 * @param productName 제품명
 * @param sku 제품 SKU
 * @param currentQuantity 현재 수량
 * @param safetyStock 안전 재고
 */
export const sendLowStockAlert = async (
  productName: string,
  sku: string,
  currentQuantity: number,
  safetyStock: number
) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      console.error('관리자 이메일이 설정되지 않았습니다.');
      return;
    }
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: adminEmail,
      subject: `[교보문고 핫트랙스 송도점] 저재고 알림: ${productName}`,
      html: `
        <h2>저재고 알림</h2>
        <p>다음 제품의 재고가 안전 재고 수준 이하로 떨어졌습니다:</p>
        <table border="1" cellpadding="5" style="border-collapse: collapse;">
          <tr>
            <th>제품명</th>
            <td>${productName}</td>
          </tr>
          <tr>
            <th>SKU</th>
            <td>${sku}</td>
          </tr>
          <tr>
            <th>현재 수량</th>
            <td>${currentQuantity}</td>
          </tr>
          <tr>
            <th>안전 재고</th>
            <td>${safetyStock}</td>
          </tr>
        </table>
        <p>재고를 보충해 주세요.</p>
        <p>감사합니다.<br>교보문고 핫트랙스 송도점 재고관리 시스템</p>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`저재고 알림 이메일이 ${adminEmail}로 전송되었습니다.`);
  } catch (error) {
    console.error('이메일 전송 오류:', error);
  }
};
