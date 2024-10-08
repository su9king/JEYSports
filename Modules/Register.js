//필요한 변수 및 모듈 선언

const { checkCode } = require('./CheckPhone.js');
const { CheckDuplicate } = require('./CheckDuplicate.js');
const connection = require('../DatabaseLoad');


// 메인 실행 코드
module.exports = {
    Register: async (data) => {

        const functionType = data["functionType"];
        const userID = data["userID"];
        

        //데이터(userID) 중복확인
        if( functionType == 0 ){
            table = "Users"
            const data2 = {userID : userID};
            const result = await CheckDuplicate(table,data2);
            return result;
        
        //회원가입
        }else if (functionType == 1){

            const userPhone = data["userPhone"];
            //CheckPhone.js 의존 코드
            //인증되었다면 1, 인증이 되지 않은 전화번호라면 0 출력
            const phoneCheck = await checkCode(userPhone,0); 


            //CheckDuplicate.js 의존 코드 
            //ID가 중복되지 않았다면 0 출력
            table = "Users"
            data2 = {userID : userID};
            const userIDCheck = await CheckDuplicate(table,data2);

            if (phoneCheck == 1 && userIDCheck == 0){
                
                const userPW = data["userPW"];
                const userGender = data["userGender"];
                const userBirth = data["userBirth"];
                const userMail = data["userMail"];
                const userAddress = data["userAddress"];
                const userName = data["userName"];
                const userConsented = data["userConsented"];
                const userConsentedDate = data["userConsentedDate"];
                const userImage = data["userImage"];

                const result = await registerUser(userID,userPW,userPhone,userGender,
                    userBirth,userMail,userAddress,userName,userConsented,
                    userConsentedDate,userImage)
                return result;

            }else{

                return 0;
            }

        }
        
    }
};

//==================================================함수 선언 파트

//회원가입
async function registerUser(userID,userPW,userPhone,userGender,userBirth,userMail,userAddress,
userName,userConsented,userConsentedDate,userImage){  /////////////////////////수정사항 맞다면 주석 삭제 요망
    return new Promise((resolve, reject) => {

        //입력받은 userID 존재하면 1 출력
        connection.query(`INSERT INTO Users (userID,userPW,userPhone,userGender,userBirth,
                                            userMail,userAddress,userName,userConsented,
                                            userConsentedDate,userImage) 
                          VALUES(?,?,?,?,?,?,?,?,?,?,?)`, 
                        [userID,userPW,userPhone,userGender,
                        userBirth,userMail,userAddress,userName,
                        userConsented,userConsentedDate,userImage],
            (error, results, fields) => {
                if (error) {
                    console.error('쿼리 실행 오류:', error);
                    return reject(error);

                } //쿼리 결과가 없다면 데이터 삽입이 제대로 작동하지 않은 것
                if (results.affectedRows > 0) {
                    resolve(1);
                } else {
                    resolve(0);
                }
            }
        );
    });
}