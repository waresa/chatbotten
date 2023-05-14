const Admin = (props) => {

    const { isUploading, onFileChange, handleAdminSubmit } = props;

    return (
    <div className='form-group files'>
        <label htmlFor="file" className="custom-file-upload">
          <i className=""></i>Last opp oppdatert dokument
        </label>

        <form onSubmit={handleAdminSubmit} >
        <div className='file-input'>
          <input id="file" type="file" onChange={onFileChange} />
        </div>
        {isUploading === true &&  <input type="submit" className='admin-btn loading' value="Laster Opp.."/>}
        {isUploading !== true && <input type="submit" className='admin-btn' value="Last Opp"/>}
        </form>
      </div>
    );

}

export default Admin;