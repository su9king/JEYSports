window.onload = async function() {
    const page = 'CreateGroupPage';
    const userToken = sessionStorage.getItem('userToken');
    const data = `userToken=${userToken}`

    const resources = await certification(page, data);
    document.getElementById('groupImageSample').src =  `/GroupImages/NULL.png`;
    
    const userImage = sessionStorage.getItem('userImage');
    const profileImage = document.getElementById('profileImage');
    profileImage.src = userImage == 'null' ? `/UserImages/NULL.jpg` : `/UserImages/${userImage}`;
}


document.addEventListener('DOMContentLoaded', function() {
    const CreateGroupForm = document.getElementById('CreateGroupForm');

    const groupName = document.getElementById('groupName');
    const groupID = document.getElementById('groupID');
    const groupIDBtn = document.getElementById('groupIDBtn');
    const allowGroupID = document.getElementById('groupIDAlert');

    let idCheck = false;

    // 뒤로가기
    document.getElementById('backButton').addEventListener('click', function() {
        window.history.back();
    });

    // 모든 label 요소에 클릭 이벤트를 방지하는 핸들러 추가
    const labels = document.querySelectorAll('label');
    labels.forEach(label => {
        label.addEventListener('click', function(e) {
            e.preventDefault(); // 클릭 이벤트 기본 동작 방지
        });
    });

    ////// GroupName 글자수 제한 //////
    groupName.addEventListener('input', function () {
        const maxLength = 10;
        const groupNameInput = this;

        if (groupNameInput.value.length > maxLength) {
            alert('조직 이름은 최대 10글자까지 입력할 수 있습니다!');
            groupNameInput.value = groupNameInput.value.slice(0, maxLength);
        }
    });

    ////// GroupID 중복 확인 버튼 //////
    groupID.addEventListener('input', async function(e) {
        e.preventDefault();
        allowGroupID.style.display = 'none'
        idCheck = false;

        const engFilter = /^[a-zA-Z0-9]*$/;

        if (!engFilter.test(groupID.value)) {
            groupID.value = groupID.value.replace(/[^a-zA-Z0-9]/g, ''); // 한글 및 기타 문자 제거
            alert('아이디는 영어와 숫자만 가능합니다!');
        }
    });

    groupIDBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        var groupID = document.getElementById('groupID').value;
        const userToken = sessionStorage.getItem('userToken');
        allowGroupID.style.display = 'none' // 가능한 조직명을 작성했다가 불가능한 id를 확인하는 경우, 가능하다는 알림을 삭제하기 위해

        const functionType = 0;
        if (groupID) {
            try {
                const response = await fetch('/CreateGroup', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ functionType: functionType, groupID: groupID , userToken : userToken })
                });
    
                data = await response.json();
    
                if (data.result == 0) {  // 사용 가능 (성공)
                    allowGroupID.style.display = 'block';
                    idCheck = true; 
                } else if (data.result == 1) {
                    document.getElementById('groupID').value = '';
                    alert('이미 사용중인 ID입니다! \n다른 ID를 이용해주세요!')
                }
            } catch (error) {
                console.error('Error:', error);
            }
        } else {
            alert('원하는 그룹 아이디를 작성해주세요!');
        }
        
    });


    //// 그룹 아이디가 필요한 이유 ////
    const infoIcon = document.getElementById('infoIcon');
    const overlay = document.getElementById('overlay');
    const infoModal = document.getElementById('infoModal');
    const closeInfoModalButton = document.getElementById('closeInfoModalButton');

    // 모달 열기
    infoIcon.addEventListener('click', function() {
        overlay.classList.remove('hidden');
        infoModal.classList.remove('hidden');
    });

    // 모달 닫기
    closeInfoModalButton.addEventListener('click', function() {
        overlay.classList.add('hidden');
        infoModal.classList.add('hidden');
    });

    // 오버레이 클릭 시 모달 닫기
    overlay.addEventListener('click', function() {
        overlay.classList.add('hidden');
        infoModal.classList.add('hidden');
    });


    ////// 이미지 저장 ////// 
    const groupImage = document.getElementById('groupImage');

    groupImage.addEventListener('change', function(event) {  
        const file = event.target.files[0];

        if (file) {  // 파일 확장자, 용량 제한
            const allowedTypes = ['image/jpeg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {  // 파일 확장자, 용량 제한
                alert('JPG와 PNG 파일만 업로드 가능합니다!');
                groupImage.value = '';
                return;
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB // 파일 확장자, 용량 제한
                alert('5MB 이하의 파일만 가능합니다!');
                groupImage.value = '';
                return;
            } 
            
            // 첨부 이미지 미리보기
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('groupImageSample').src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById('groupImageSample').src =  `/GroupImages/NULL.png`;
        }
    });


    ////// 최종 회원가입 폼 제출 //////
    CreateGroupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userToken = sessionStorage.getItem('userToken');

        const groupName = document.getElementById('groupName').value;
        const groupNumber = document.getElementById('groupNumber').value;
        const groupID = document.getElementById('groupID').value;
        const groupLocation = document.getElementById('groupLocation').value;

        let groupPW = document.getElementById('groupPW').value;
        let groupClassification = document.getElementById('groupClassification').value;
        let groupSportType = document.getElementById('groupSportType').value;

        let groupImage = document.getElementById('groupImage').files[0] ? document.getElementById('groupImage').files[0] : null;

        // null값 허용
        groupPW = allowNull(groupPW);
        groupClassification = allowNull(groupClassification);
        groupSportType = allowNull(groupSportType);
        
        console.log('groupImage', groupImage);
        
        if ( groupClassification == 'empty') { 
            alert('조직 분류를 선택해 주세요!');
            return
        } else if (groupSportType == 'empty') {
            alert('활동 종목을 선택해 주세요!');
        }


        if (groupName && groupNumber && groupID && idCheck == true && groupLocation ) {
            const functionType = 1;

            const response = await fetch('/CreateGroup', {
                method : 'POST',
                headers : {'Content-Type': 'application/json'},
                body : JSON.stringify({ functionType: functionType,
                                        userToken : userToken,
                                        groupName: groupName,
                                        groupNumber: groupNumber,
                                        groupID: groupID, 
                                        groupPW: groupPW, 
                                        groupLocation: groupLocation,
                                        groupClassification: groupClassification, 
                                        groupSportType: groupSportType,
                                        groupImage: null
                                        })
            });

            data =  await response.json();

            if (data.result == 1) {

                const groupToken = data.resources["groupToken"];
                const functionType = 2;

                await imageUpload(functionType, userToken, groupImage, groupToken );             
                
                alert("조직 생성이 완료되었습니다!");
                window.location.href = '/PrivatePage/PrivatePage.html'; 

            } else {
                alert('다시 시도해주세요!');
            }

        } else if (idCheck == false) {
            alert('ID 중복 체크를 진행해주세요!!');
        } else if (groupImage == undefined) {
            alert('그룹의 프로필 사진을 추가해주세요!!');
        }
        else {
            alert('제시된 정보를 모두 채워주세요!');
        }
    
        function allowNull(userData) {
            if (userData == '') {
                userData = null;
                return userData;
            } else {
                return userData;
            }
        }

    });






});