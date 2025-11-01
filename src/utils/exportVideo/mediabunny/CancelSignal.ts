export class CancelSignal {
  private _isCanceled = false;
  get isCanceled() {
    return this._isCanceled;
  }
  cancel = () => {
    this._isCanceled = true;
  };
}
