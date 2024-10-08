let myData = null;
let members = [];
let notuserMembers = [];
let userToken, groupToken, userPermission, noticeToken;
let initialMembersState = [];
previousPage = new URLSearchParams(window.location.search).get('previousPage');
window.onload = async function () {
    const page = 'EditNoticeDuesPage';
    userToken = sessionStorage.getItem('userToken');
    groupToken = sessionStorage.getItem('groupToken');
    userPermission = sessionStorage.getItem('userPermission');

    noticeToken = new URLSearchParams(window.location.search).get('noticeToken');
    previousPage = `/GroupNoticePage/DetailNoticeDuesPage.html?noticeToken=${noticeToken}&previousPage=${previousPage}`
    
    const data = `userToken=${userToken}&groupToken=${groupToken}&userPermission=${userPermission}&noticeToken=${noticeToken}`;
    
    const response = await certification(page, data);
    console.log(response.resources);
    

    loadSidebar(page, userPermission, response);
    loadMenubar(sessionStorage.getItem('groupName'));

    
    myData = response.resources[1][0];       // 내 회비 납부 데이터
    members = response.resources[2];         // 멤버 리스트
    notuserMembers = response.resources[3];  // 비유저 회비 데이터

    // 초기 멤버 상태 저장
    initialMembersState = [...members.map(member => ({ ...member })), ...notuserMembers.map(member => ({ ...member }))];

    displayAnnouncement(response.resources[0][0]);
    displayMemberDues();
    displayMyData();

    document.getElementById('saveButton').addEventListener('click', saveDuesSatus);

    setupSearchInput();
}

function displayAnnouncement(announcement) {
    
    document.getElementById('noticeTitle').value = announcement.noticeTitle;
    document.getElementById('noticeEndDate').value = announcement.noticeEndDate;
    document.getElementById('noticeImportance').value = announcement.noticeImportance == "중요" ? 1 : 0;
    document.getElementById('noticeStatus').value = announcement.noticeStatus == "공개" ? 1 : 0;
    document.getElementById('noticeDues').value = announcement.noticeDues;
    document.getElementById('noticeContent').value = announcement.noticeContent;
    document.getElementById('noticeWriter').value = announcement.noticeWriter;
    
    document.getElementById('noticeDues').disabled = 'true';

    // 공지사항 종료 날짜 설정
    const noticeEndDateInput = document.getElementById('noticeEndDate');
    const noEndDateCheckbox = document.getElementById('noEndDate');

    // 종료날짜 없음 체크박스
    noEndDateCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // 체크박스가 체크 -> 종료 날짜를 null, 날짜 선택 금지
            noticeEndDateInput.value = null;
            noticeEndDateInput.disabled = true;
        } else {
            noticeEndDateInput.disabled = false;
        }
    });

    const noticeEndDate = noticeEndDateInput.value ? noticeEndDateInput.value : null;


    //수정한 날짜 변수 설정
    const noticeEditDate = new Date().toISOString().split('T')[0];

    const saveButton = document.getElementById('saveAnnouncementButton');
    saveButton.textContent = '공지사항 수정';
    saveButton.addEventListener('click', async function () {
    
        const response = await fetch('/EditGroupNotices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPermission: userPermission,
                functionType: 3,
                userToken: userToken,
                groupToken: groupToken,
                noticeToken: noticeToken,
                noticeEditDate : noticeEditDate,
                noticeTitle: document.getElementById('noticeTitle').value,
                noticeEndDate: noticeEndDate,
                noticeImportance: document.getElementById('noticeImportance').value,
                noticeStatus: document.getElementById('noticeStatus').value,
                noticeDues: document.getElementById('noticeDues').value,
                noticeContent: document.getElementById('noticeContent').value,
                noticeWriter: document.getElementById('noticeWriter').value
            })
        });
    
        const data = await response.json();
        if (data.result == 1) {
            alert('공지사항이 수정되었습니다!');
            location.reload();
        } else {
            alert('수정에 실패했습니다. 다시 시도해주세요.');
        }
    });
    

}

document.addEventListener('DOMContentLoaded', function() {
    const noEndDateCheckbox = document.getElementById('noEndDate');

    // 모든 label 요소에 클릭 이벤트를 방지하는 핸들러 추가
    const labels = document.querySelectorAll('label');
    labels.forEach(label => {
        label.addEventListener('click', function(e) {
            e.preventDefault(); // 클릭 이벤트 기본 동작 방지
        });
    });
});


function displayMemberDues(filteredMembers = null) {
    const memberList = document.getElementById('user-member-container');
    memberList.innerHTML = '';

    const allMembers = [...members, ...notuserMembers];
    const displayList = filteredMembers || allMembers;

    const userMembers = displayList.filter(member => member.userID);
    if (userMembers.length > 0) {
        const userTitle = document.createElement('h2');
        userTitle.textContent = '멤버들';
        memberList.appendChild(userTitle);
        userMembers.forEach(member => {
            const memberBox = createMemberBox(member, false, false);
            memberList.appendChild(memberBox);
        });
    }

    const notUserMembers = displayList.filter(member => member.notUserToken);
    if (notUserMembers.length > 0) {
        const notUserTitle = document.createElement('h2');
        notUserTitle.textContent = '비유저 멤버들';
        memberList.appendChild(notUserTitle);
        notUserMembers.forEach(member => {
            const memberBox = createMemberBox(member, false, true);
            memberList.appendChild(memberBox);
        });
    }
}


function displayMyData() {
    const myDataContainer = document.getElementById('my-data-container');
    if (myData) {
        const myTitle = document.createElement('h2');
        myTitle.textContent = '나의 납부 현황';
        myDataContainer.appendChild(myTitle);
        const myBox = createMemberBox(myData, true, false);
        myDataContainer.appendChild(myBox);
    } else {
        myDataContainer.innerHTML = '<h2>나의 납부 현황</h2><p>납부 정보가 없습니다.</p>';
    }
}


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

    const duesStatusContainer = document.createElement("div");
    duesStatusContainer.classList.add("dues-status-container");

    const statusOptions = [
        { value: true, text: '납부 완료', color: '#4caf50' },
        { value: false, text: '미납', color: '#f44336' }
    ];

    statusOptions.forEach(option => {
        const statusButton = document.createElement("button");
        statusButton.textContent = option.text;
        statusButton.classList.add("status-button");

        if (member.duesStatus == option.value) {
            statusButton.style.backgroundColor = option.color;
            statusButton.style.transform = "translateY(-3px)";
        } else {
            statusButton.style.backgroundColor = "#e0e0e0";
        }

        statusButton.addEventListener("click", () => {
            member.duesStatus = option.value;
            displayMemberDues();
        });

        duesStatusContainer.appendChild(statusButton);
    });

    memberBox.appendChild(memberImage);
    memberBox.appendChild(memberInfo);
    memberBox.appendChild(duesStatusContainer);

    return memberBox;
}

async function saveDuesSatus() {
    const datas = [];

    const compareMembers = (initial, current, functionType) => {
        return initial.map((member, index) => {
            if (member.duesStatus !== current[index].duesStatus) {
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

        if (datas.length == 0) {
            alert('회비 납부 상태를 변경해주세요!');
            return;
        }

        const data = {
            userToken: userToken,
            groupToken: groupToken,
            noticeToken: noticeToken,
            userPermission : userPermission,
            datas: datas
        };
        console.log(data);
        const response = await fetch('/EditDuesList', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.result == 1) {
            alert('회비 상태가 저장되었습니다.');
            location.reload();
        } else {
            alert('회비 상태 저장에 실패했습니다. 다시 시도해주세요.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('회비 상태 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

function setupSearchInput() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const filteredMembers = [...members, ...notuserMembers].filter(member => member.userName.toLowerCase().includes(query));
        displayMemberDues(filteredMembers);
    });
}
