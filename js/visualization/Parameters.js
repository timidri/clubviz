export class Parameters {
    constructor() {
        this.traitRatioSlider = document.getElementById('traitRatio');
        this.traitRatioValue = document.getElementById('traitRatioValue');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.traitRatioSlider.addEventListener('input', () => {
            this.updateTraitRatioDisplay();
        });
    }

    updateTraitRatioDisplay() {
        const value = (this.traitRatioSlider.value * 100).toFixed(0);
        this.traitRatioValue.textContent = `${value}%`;
    }

    getTraitRatio() {
        return parseFloat(this.traitRatioSlider.value);
    }
}