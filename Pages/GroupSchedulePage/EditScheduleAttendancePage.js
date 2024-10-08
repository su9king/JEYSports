let myData = null;
let members = [];
let notuserMembers = [];
let userToken, groupToken, userPermission, scheduleToken, scheduleAttendanceCode;
let initialMembersState = [];
previousPage = new URLSearchParams(window.location.search).get('previousPage');

window.onload = async function () {
    const page = 'EditScheduleAttendancePage';
    userToken = sessionStorage.getItem('userToken');
    groupToken = sessionStorage.getItem('groupToken');
    userPermission = sessionStorage.getItem('userPermission');

    scheduleToken = new URLSearchParams(window.location.search).get('scheduleToken');
    previousPage = `/GroupSchedulePage/DetailScheduleAttendancePage.html?scheduleToken=${scheduleToken}&previousPage=${previousPage}`

    const data = `userToken=${userToken}&groupToken=${groupToken}&userPermission=${userPermission}&scheduleToken=${scheduleToken}`;

    const response = await certification(page, data);
    console.log(response.resources);


    loadSidebar(page, userPermission, response);
    loadMenubar(sessionStorage.getItem('groupName'));


    scheduleAttendanceCode = response.resources[0][0].scheduleAttendanceCode;
    myData = response.resources[1][0];        // 내 출석 데이터
    members = response.resources[2];          // 멤버 출석 데이터
    notuserMembers = response.resources[3];   // 비유저 출석 데이터

    initialMembersState = [...members.map(member => ({ ...member })), ...notuserMembers.map(member => ({ ...member }))];

    displayAnnouncement(response.resources[0][0]);
    displayMyData();
    displayMembers();
    createCodeContainer(userPermission);

    document.getElementById('saveButton').addEventListener('click', saveAttendanceStatus);

    setupSearchInput();
}

document.addEventListener('DOMContentLoaded', function() {
    // 모든 label 요소에 클릭 이벤트를 방지하는 핸들러 추가
    const labels = document.querySelectorAll('label');
    labels.forEach(label => {
        label.addEventListener('click', function(e) {
            e.preventDefault(); // 클릭 이벤트 기본 동작 방지
        });
    });
});


//////////////////////////////////////////////////// 공지사항 수정 섹션
function displayAnnouncement(announcement) {
    document.getElementById('scheduleTitle').value = announcement.scheduleTitle;
    document.getElementById('scheduleStartDate').value = announcement.scheduleStartDate;
    document.getElementById('scheduleEndDate').value = announcement.scheduleEndDate;
    document.getElementById('scheduleImportance').value = announcement.scheduleImportance == "일반" ? 0 : 1;
    document.getElementById('scheduleAlert').value = announcement.scheduleAlert == "없음" ? 0 : 1;
    document.getElementById('scheduleContent').value = announcement.scheduleContent;
    document.getElementById('scheduleLocation').value = announcement.scheduleLocation;


    const scheduleStartDateInput = document.getElementById('scheduleStartDate');
    const scheduleEndDateInput = document.getElementById('scheduleEndDate');
    const noEndDateCheckbox = document.getElementById('noEndDate');
    const scheduleEndDate = document.getElementById('scheduleEndDate');

    // 종료날짜 없음 체크박스
    noEndDateCheckbox.addEventListener('change', function() {
        if (this.checked) {
            if (scheduleStartDateInput.value) {
                // 체크박스가 체크 -> 종료 날짜와 시작 날짜 동일, 종료 날짜 비활성화
                scheduleEndDateInput.value = scheduleStartDateInput.value;
                scheduleEndDateInput.disabled = true;
            } else {
                // 체크박스 체크 시 시작 날짜가 없는 경우
                this.checked = false;
                alert('시작 날짜를 선택해주세요!');
            }
        } else {
            // 체크박스가 언체크된 경우 -> 종료 날짜를 선택할 수 있도록 함
            scheduleEndDateInput.disabled = false;
            scheduleEndDateInput.value = '';
        }
    });

    // 시작 날짜 변경 시 종료 날짜에 적용
    scheduleStartDateInput.addEventListener('change', function() {
        if (noEndDateCheckbox.checked) {
            scheduleEndDateInput.value = this.value;
        }
    });

    // 시작 날짜가 종료 날짜보다 늦은 경우
    scheduleEndDate.addEventListener('change', function() {
        const startDate = new Date(document.getElementById('scheduleStartDate').value);
        const endDate = new Date(document.getElementById('scheduleEndDate').value);

        if (startDate > endDate) {
            // 경고 메시지를 띄웁니다.
            alert('시작 날짜는 종료 날짜보다 앞서야 합니다.');
            document.getElementById('scheduleEndDate').value = '';
        }
    });



    // 공지사항 수정사항 저장 버튼
    const saveButton = document.getElementById('saveAnnouncementButton');
    saveButton.textContent = '공지사항 수정';
    saveButton.addEventListener('click', async function () {

        const response = await fetch('/EditGroupSchedules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPermission: userPermission,
                functionType: 3,
                userToken: userToken,
                groupToken: groupToken,
                scheduleToken: scheduleToken,

                scheduleTitle: document.getElementById('scheduleTitle').value,
                scheduleStartDate: document.getElementById('scheduleStartDate').value,
                scheduleEndDate: document.getElementById('scheduleEndDate').value,
                scheduleImportance: document.getElementById('scheduleImportance').value,
                scheduleAlert: document.getElementById('scheduleAlert').value,
                scheduleContent: document.getElementById('scheduleContent').value,
                scheduleLocation: document.getElementById('scheduleLocation').value,

            })
        });

        const data = await response.json();
        if (data.result == 1) {
            alert('공지사항이 수정되었습니다!');
            window.location.href = `DetailScheduleAttendancePage.html?scheduleToken=${scheduleToken}`;
        } else {
            alert('수정에 실패했습니다. 다시 시도해주세요.');
        }
    });

}



//////////////////////////////////////////////////// 출석 상태 수정 섹션
// 나의 출석 상태
function displayMyData() {
    const myDataContainer = document.getElementById('my-data-container');
    if (myData) {
        const myTitle = document.createElement('h2');
        myTitle.textContent = '나의 출석 현황';
        myDataContainer.appendChild(myTitle);
        const myBox = createMemberBox(myData, true, false);
        myDataContainer.appendChild(myBox);
    } else {
        myDataContainer.innerHTML = '<h2>나의 출석 현황</h2><p>출석 정보가 없습니다.</p>';
    }
}

// 멤버들(유저+비유저) 출석 상태
function displayMembers(filteredMembers = null) {
    const userMemberContainer = document.getElementById("user-member-container");
    userMemberContainer.innerHTML = '';

    const allMembers = [...members, ...notuserMembers];
    const displayList = filteredMembers || allMembers;

    const userMembers = displayList.filter(member => member.userID);
    if (userMembers.length > 0) {
        const userTitle = document.createElement('h2');
        userTitle.textContent = '멤버들';
        userMemberContainer.appendChild(userTitle);
        userMembers.forEach(member => {
            const memberBox = createMemberBox(member, false, false);
            userMemberContainer.appendChild(memberBox);
        });
    }

    const notUserMembers = displayList.filter(member => member.notUserToken);
    if (notUserMembers.length > 0) {
        const notUserTitle = document.createElement('h2');
        notUserTitle.textContent = '비유저 멤버들';
        userMemberContainer.appendChild(notUserTitle);
        notUserMembers.forEach(member => {
            const memberBox = createMemberBox(member, false, true);
            userMemberContainer.appendChild(memberBox);
        });
    }
}


// 출석 상태 박스 생성
function createMemberBox(member, isMyStatus = false, isNotUser = false) {
    const memberBox = document.createElement("div");
    memberBox.classList.add("memberBox");

    const memberImage = document.createElement("img");
    memberImage.src = isNotUser ? `/UserImages/NULL.jpg` : (member.userImage ? `/UserImages/${member.userImage}` : `/UserImages/NULL.jpg`);
    memberImage.alt = `${member.userName}의 프로필 사진`;
    memberImage.classList.add("member-image");

    const memberInfo = document.createElement("div");
    memberInfo.classList.add("member-info");
    memberInfo.innerHTML = `<h2 class="member-name">${member.userName}</h2>`;

    const attendanceStatusContainer = document.createElement("div");
    attendanceStatusContainer.classList.add("attendance-status-container");

    const statusOptions = [
        { value: 1, text: '참석', color: '#4caf50' },
        { value: 0, text: '결석', color: '#f44336' },
        { value: null, text: '미확인', color: '#ccc' },
    ];

    statusOptions.forEach(option => {
        const statusButton = document.createElement("button");
        statusButton.textContent = option.text;
        statusButton.classList.add("status-button");

        if (member.attendanceStatus == option.value) {
            statusButton.style.backgroundColor = option.color;
            statusButton.style.transform = "translateY(-3px)";
        } else {
            statusButton.style.backgroundColor = "#e0e0e0";
        }

        statusButton.addEventListener("click", () => {
            member.attendanceStatus = option.value;
            displayMembers();
        });

        attendanceStatusContainer.appendChild(statusButton);
    });

    memberBox.appendChild(memberImage);
    memberBox.appendChild(memberInfo);
    memberBox.appendChild(attendanceStatusContainer);

    return memberBox;
}


// 출석 상태 수정 저장 버튼
async function saveAttendanceStatus() {
    const datas = [];

    const compareMembers = (initial, current, functionType) => {
        return initial.map((member, index) => {
            if (member.attendanceStatus !== current[index].attendanceStatus) {
                return { ...current[index], functionType };
            }
            return null;
        }).filter(item => item !== null);
    };

    try {
        const changedUserMembers = compareMembers(
            initialMembersState.filter(m => m.userID),
            members.filter(m => m.userID),
            1  // 멤버는 functionType == 1
        );

        const changedNotUserMembers = compareMembers(
            initialMembersState.filter(m => m.notUserToken),
            notuserMembers.filter(m => m.notUserToken),
            2  // 비회원 멤버는 functionType == 2
        );

        datas.push(...changedUserMembers, ...changedNotUserMembers);

        if (datas.length === 0) {
            alert('멤버의 출석 상태를 변경해주세요!');
            return;
        }
        console.log(userPermission)
        const data = {
            userToken: userToken,
            groupToken: groupToken,
            scheduleToken: scheduleToken,
            datas: datas,
            userPermission : userPermission
        };

        // 서버로 데이터 전송
        const response = await fetch('/EditAttendanceList', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.result === 1) {
            alert('출석 상태가 저장되었습니다.');
            location.reload();
        } else {
            alert('출석 상태 저장에 실패했습니다. 다시 시도해주세요.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('출석 상태 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}


// 출석 코드 박스 생성
function createCodeContainer(permission) {
    ///////////////// 출석 코드 생성 컨테이너 생성
    const scheduleCodeContainer = document.getElementById('code-container');
    scheduleCodeContainer.innerHTML = '';

    if (scheduleAttendanceCode == null) {
        const message = document.createElement('h2');
        message.textContent = "출석 코드를 생성해주세요!";
        scheduleCodeContainer.appendChild(message);
    } else {
        const message = document.createElement('h2');
        message.textContent = `오늘의 출석 코드 : ${scheduleAttendanceCode}`;
        scheduleCodeContainer.appendChild(message);
    }

    const codeInput = document.createElement('input');
    codeInput.type = 'text';
    codeInput.placeholder = '출석 코드를 입력하세요';
    codeInput.id = 'attendance-code-input';
    scheduleCodeContainer.appendChild(codeInput);

    const codeButton = document.createElement('button');
    codeButton.textContent = '출석 코드 제출';
    codeButton.id = 'attendance-code-button';
    scheduleCodeContainer.appendChild(codeButton);
    
  

    codeButton.addEventListener('click', async () => {
        scheduleAttendanceCode = document.getElementById('attendance-code-input').value;
        const datas = [{functionType : 3,scheduleAttendanceCode : scheduleAttendanceCode}]
        try {
            
            const response = await fetch('/EditAttendanceList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userToken: userToken,
                    groupToken: groupToken,
                    userPermission: userPermission,
                    scheduleToken : scheduleToken,
                    datas : datas
                })
            });

            const data = await response.json();

            if (data.result == 0) {
                alert('다시 시도해주세요!');
            } else if (data.result == 1) {
                alert('출석코드가 변경되었습니다!');
                location.reload();
            } else {
                alert('관리자에게 문의해주세요');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    })
}


// 검색 기능
function setupSearchInput() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const filteredMembers = [...members, ...notuserMembers].filter(member => member.userName.toLowerCase().includes(query));
        displayMembers(filteredMembers);
    });
}
