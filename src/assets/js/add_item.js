document.addEventListener("DOMContentLoaded", function(){

    // IMAGE PREVIEW
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');
    const uploadLabel = document.getElementById('uploadLabel');
    if(imageInput && imagePreview && uploadLabel){
        imageInput.addEventListener('change', function(){
            const file=this.files[0];
            if(file){
                const reader=new FileReader();
                reader.onload=function(e){
                    imagePreview.src=e.target.result;
                    imagePreview.style.display='block';
                    uploadLabel.style.display='none';
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.src='#';
                imagePreview.style.display='none';
                uploadLabel.style.display='inline-flex';
            }
        });
        imagePreview.addEventListener('click', ()=> imageInput.click());
    }


    // SERIAL MODAL LOGIC
    const openModalBtn=document.getElementById("openSerialModal");
    const serialModal=document.getElementById("serialModal");
    const closeModalBtn=document.getElementById("closeSerialModal");
    const saveSerialBtn=document.getElementById("saveSerialNumbers");
    const serialFieldsContainer=document.getElementById("serialFieldsContainer");
    const hiddenSerialInput=document.getElementById("serialHiddenInput");
    const totalStockField=document.querySelector("input[name='total_stock']");
    const modalSerialError=document.getElementById("modalSerialError");
    const serialErrorText=document.getElementById("serialErrorText");

    let serialNumbers=[];

    if(openModalBtn && serialModal){
        openModalBtn.addEventListener("click", e=>{
            e.preventDefault();
            const totalStock=parseInt(totalStockField.value);
            if(!totalStock || totalStock<=0){ alert("Enter valid Total Stock."); return; }
            serialFieldsContainer.innerHTML="";
            if(modalSerialError) modalSerialError.classList.remove("show");
            const existingSerials=hiddenSerialInput.value.split(',').map(s=>s.trim()).filter(s=>s);
            for(let i=1;i<=totalStock;i++){
                const input=document.createElement("input");
                input.type="text";
                input.placeholder=`Serial Number ${i} (optional)`;
                input.classList.add("serial-field");
                if(existingSerials[i-1]) input.value=existingSerials[i-1];
                else if(serialNumbers[i-1]) input.value=serialNumbers[i-1];
                serialFieldsContainer.appendChild(input);
            }
            serialModal.style.display="flex";
        });
    }

    if(closeModalBtn && serialModal){
        closeModalBtn.addEventListener("click", e=>{
            e.preventDefault();
            serialModal.style.display="none";
            if(modalSerialError) modalSerialError.classList.remove("show");
        });
    }

    if(saveSerialBtn){
        saveSerialBtn.addEventListener("click", e=>{
            e.preventDefault();
            const inputs=document.querySelectorAll(".serial-field");
            const totalStock=parseInt(totalStockField.value);
            serialNumbers=Array.from(inputs).map(i=>i.value.trim()).filter(Boolean);
            const filledCount=serialNumbers.length;

            if(filledCount>0 && filledCount!==totalStock){
                if(modalSerialError && serialErrorText){
                    serialErrorText.textContent=`You've filled ${filledCount} serial number(s), but Total Stock is ${totalStock}.`;
                    modalSerialError.classList.add("show");
                } else alert(`Serial mismatch: filled ${filledCount}, required ${totalStock}`);
                return;
            }

            const uniqueSerials=[...new Set(serialNumbers)];
            if(uniqueSerials.length!==serialNumbers.length){
                if(modalSerialError && serialErrorText){
                    serialErrorText.textContent='Duplicate serial numbers detected.';
                    modalSerialError.classList.add("show");
                } else alert('Duplicate serial numbers detected.');
                return;
            }

            hiddenSerialInput.value=serialNumbers.join(",");
            serialModal.style.display="none";
            if(modalSerialError) modalSerialError.classList.remove("show");
        });
    }

    if(serialModal){
        serialModal.addEventListener("mousedown", e=>{
            if(e.target===serialModal){
                serialModal.style.display="none";
                if(modalSerialError) modalSerialError.classList.remove("show");
            }
        });
    }



    const mobileBackBtn = document.getElementById('mobileBackBtn');
    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            history.back();
        });
    }

});





